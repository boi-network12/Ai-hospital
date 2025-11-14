// utils/api.ts
import * as SecureStore from 'expo-secure-store';

export const BACKEND_URI = 'https://neuromed-ai-backend.vercel.app';
// For production: 'https://neuromed-ai-backend.vercel.app'

interface ApiFetchOptions extends RequestInit {
  body?: any; 
  signal?: AbortSignal;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// -------------------------------
// Cache Helper
// -------------------------------
export async function fetchWithCache<T>(
  key: string,
  url: string,
  opts?: RequestInit
): Promise<T> {
  const cached = await SecureStore.getItemAsync(key);
  if (cached) {
    const { data, ts } = JSON.parse(cached) as { data: T; ts: number };
    if (Date.now() - ts < CACHE_TTL) return data;
  }

  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as T;

  await SecureStore.setItemAsync(
    key,
    JSON.stringify({ data: json, ts: Date.now() })
  );
  return json;
}

// -------------------------------
// Token Refresh Queue
// -------------------------------
interface QueueItem {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};


// -------------------------------
// Central API Fetch with Auth & Error Handling
// -------------------------------
export async function apiFetch<T = any>(
  endpoint: string,
  opts: ApiFetchOptions = {}
): Promise<T> {
  const url = `${BACKEND_URI}/api/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = new Headers(opts.headers ?? {});

  // Set Content-Type for JSON bodies
  if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    if (typeof opts.body === 'object') {
      opts.body = JSON.stringify(opts.body);
    }
  }

  // Add Authorization header if token exists
  let accessToken = await SecureStore.getItemAsync('accessToken');
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let res = await fetch(url, { ...opts, headers, signal: opts.signal });

  // -------------------------------
  // Handle 401 → Try Refresh Token
  // -------------------------------
  if (
    res.status === 401 &&
    !endpoint.includes('/refresh')&&
    !endpoint.includes('/login') &&
    !endpoint.includes('/register')
  ) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            headers.set('Authorization', `Bearer ${token}`);
            fetch(url, { ...opts, headers })
              .then((r) => r.json())
              .then(resolve)
              .catch(reject);
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const refreshRes = await fetch(`${BACKEND_URI}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) {
        const errBody = (await refreshRes.json().catch(() => ({}))) as any;
        throw new Error(errBody.message || 'Refresh failed');
      }

      const { accessToken: newAccessToken } = (await refreshRes.json()) as {
        accessToken: string;
      };
      if (!newAccessToken || typeof newAccessToken !== 'string') {
        throw new Error('Invalid access token');
      }

      await SecureStore.setItemAsync('accessToken', newAccessToken);
      headers.set('Authorization', `Bearer ${newAccessToken}`);

      processQueue(null, newAccessToken);

      // Retry original request
      res = await fetch(url, { ...opts, headers });
    } catch (err: any) {
      processQueue(err, null);
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      throw err;
    } finally {
      isRefreshing = false;
    }
  }

  // -------------------------------
  // Handle All Errors (Including 401 from login)
  // -------------------------------
  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      // Ignore JSON parse errors
    }

    const serverMessage = body?.message || body?.error;
    const fallbackMessage = `HTTP ${res.status}${res.status === 401 ? ' Unauthorized' : ''}`;
    const message = serverMessage || fallbackMessage;

    const error: any = new Error(message);
    error.status = res.status;
    error.body = body;
    throw error;
  }

  // This line was causing "no-unused-expressions"
  // Fix: assign to variable
  const data = await res.json();
  return data as T;
}

// -------------------------------
// Optional: Human-Readable Error Helper
// -------------------------------
export const handleApiError = (error: any): string => {
  if (error?.body?.message) return error.body.message;
  if (error?.message?.includes('Invalid credentials')) return 'Invalid email or password';
  if (error?.message?.includes('No refresh token')) return 'Session expired. Please log in again.';
  if (error?.message?.includes('Network')) return 'No internet connection';
  if (error?.status === 401) return 'Unauthorized. Please log in.';
  if (error?.status >= 500) return 'Server error. Try again later.';
  return error?.message || 'Something went wrong';
};