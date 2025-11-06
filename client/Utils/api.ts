// utils/api.ts
import * as SecureStore from 'expo-secure-store';

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
  const json = await res.json();
  await SecureStore.setItemAsync(key, JSON.stringify({ data: json, ts: Date.now() }));
  return json;
}