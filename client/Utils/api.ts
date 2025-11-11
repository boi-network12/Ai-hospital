// utils/api.ts
import * as SecureStore from 'expo-secure-store';

export const BACKEND_URI = 'https://neuromed-ai.pxxl.click'; // primary
export const BACKEND_URI_FALLBACK = 'https://neuromed-ai-backend.vercel.app';

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

/** Centralised fetch that adds authorization header automatically */
export async function apiFetch<T = any>(
  endpoint: string,
  opts: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_URI}/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const token = await SecureStore.getItemAsync('accessToken');
  const headers = new Headers(opts.headers ?? {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    const err: any = new Error(`API error ${res.status}`);
    err.status = res.status;
    err.body = await res.json().catch(() => ({}));
    throw err;
  }
  return res.json();
}