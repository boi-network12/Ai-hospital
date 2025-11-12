// utils/api.ts
import * as SecureStore from 'expo-secure-store';

export const BACKEND_URI = 'https://neuromed-ai.pxxl.click';
// API: https://neuromed-ai.pxxl.click

const CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function fetchWithCache<T>(
  key: string,
  url: string,
  opts?: RequestInit
): Promise<T> {
  const cached = await SecureStore.getItemAsync(key);
  if (cached) {
    const { data, ts } = JSON.parse(cached);
    if (Date.now() - ts < CACHE_TTL) return data;
  }

  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json();

  await SecureStore.setItemAsync(key, JSON.stringify({ data: json, ts: Date.now() }));
  return json;
}

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

/** Centralised fetch that adds authorization header automatically */
export async function apiFetch<T = any>(endpoint: string, opts: RequestInit = {}): Promise<T> {
  const url = `${BACKEND_URI}/api/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  // ----- NEW -----
  let body = opts.body;
  const headers = new Headers(opts.headers ?? {});

  if (body && typeof body === 'string' && body.trim().startsWith('{')) {
    headers.set('Content-Type', 'application/json');
  }
  // ----------------

  let token = await SecureStore.getItemAsync('accessToken');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (opts.body && typeof opts.body === 'object') {
    headers.set('Content-Type', 'application/json');
  }

  let res = await fetch(url, { ...opts, headers });

  if (res.status === 401 && !endpoint.includes('/refresh') && !endpoint.includes('/login')) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(newToken => {
        headers.set('Authorization', `Bearer ${newToken}`);
        return fetch(url, { ...opts, headers }).then(r => r.json());
      });
    }

    isRefreshing = true;
    try {
      const refresh = await SecureStore.getItemAsync('refreshToken');
      if (!refresh) throw new Error('No refresh token');

      const data = await fetch(`${BACKEND_URI}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (!data.ok) throw new Error('Refresh failed');

      const json = await data.json();

      if (!json?.accessToken || typeof json.accessToken !== 'string') {
        throw new Error('Invalid access token from server');
      }

      await SecureStore.setItemAsync('accessToken', json.accessToken);
      token = json.accessToken;
      headers.set('Authorization', `Bearer ${token}`);

      processQueue(null, token);

      res = await fetch(url, { ...opts, headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      processQueue(err, null);
      // Optional: logout user
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }

  if (!res.ok) {
    const err: any = new Error(`API error ${res.status}`);
    err.status = res.status;
    try { err.body = await res.json(); } catch {}
    throw err;
  }

  return res.json();
}