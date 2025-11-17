import { deleteCookie, getCookie, setCookie } from '@/helper/cookie';

const BACKEND_URI = 'https://neuromed-ai-backend.vercel.app';
// https://neuromed-ai-backend.vercel.app
// http://172.24.150.4:8080

/* -------------------------------------------------
   Request options – body can be anything that fetch
   accepts (string, FormData, Blob, …) or undefined.
   ------------------------------------------------- */
interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | Record<string, unknown> | null;
}

/* ---------- token refresh queue ---------- */
let isRefreshing = false;
interface QueueItem {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

/* ---------- main fetch function ---------- */
export async function apiFetch<T = unknown>(
  endpoint: string,
  opts: ApiFetchOptions = {}
): Promise<T> {
  const url = `${BACKEND_URI}/api/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = new Headers(opts.headers ?? {});

  // ---------- JSON body ----------
  let fetchBody: BodyInit | undefined;
  if (opts.body != null) {
    if (typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
      fetchBody = JSON.stringify(opts.body);
    } else {
      fetchBody = opts.body as BodyInit;
    }
  }

  // ---------- access token ----------
  const accessToken = getCookie('accessToken');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  // ---------- first request ----------
  let res = await fetch(url, { ...opts, headers, body: fetchBody });

  /* ---------- 401 → refresh token flow ---------- */
  if (
    res.status === 401 &&
    !endpoint.includes('/refresh') &&
    !endpoint.includes('/login') &&
    !endpoint.includes('/register')
  ) {
    if (isRefreshing) {
      // wait for the ongoing refresh
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken) => {
            headers.set('Authorization', `Bearer ${newToken}`);
            fetch(url, { ...opts, headers, body: fetchBody })
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
      const refreshToken = getCookie('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const refreshRes = await fetch(`${BACKEND_URI}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) throw new Error('Refresh failed');

      const { accessToken: newAccessToken } = (await refreshRes.json()) as {
        accessToken: string;
      };

      setCookie('accessToken', newAccessToken, 1); // 1 day
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      processQueue(null, newAccessToken);

      // retry original request with the new token
      res = await fetch(url, { ...opts, headers, body: fetchBody });
    } catch (err) {
      processQueue(err);
      deleteCookie('accessToken');
      deleteCookie('refreshToken');
      deleteCookie('user');
      throw err;
    } finally {
      isRefreshing = false;
    }
  }

  class ApiError extends Error {
    status: number;
    body: unknown;

    constructor(message: string, status: number, body: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
    }

    /* ---------- error handling ---------- */
    if (!res.ok) {
    let body: unknown = null;
    try {
        body = await res.json();
    } catch {
        // ignore JSON parse errors
    }

    const message = typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message: string }).message
        : `HTTP ${res.status}`;

    throw new ApiError(message, res.status, body);
    }

  return (await res.json()) as T;
}