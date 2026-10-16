import { request } from '@/lib/request';

export type ServerHttpResult<T> = {
  data: T;
  status: number;
  headers: Headers;
};

export class ServerHttpError extends Error {
  status: number;
  headers: Headers;
  body: unknown;

  constructor(message: string, status: number, headers: Headers, body?: unknown) {
    super(message);
    this.name = 'ServerHttpError';
    this.status = status;
    this.headers = headers;
    this.body = body;
  }
}

export async function serverGetJson<T>(url: string, init: RequestInit = {}): Promise<ServerHttpResult<T>> {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const response = await fetch(url, {
    ...init,
    method: 'GET',
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'object'
        ? String((body.error as { message?: unknown }).message ?? 'Upstream request failed')
        : `Upstream request failed with status ${response.status}`;
    throw new ServerHttpError(message, response.status, response.headers, body);
  }

  return { data: body as T, status: response.status, headers: response.headers };
}

export type OfflineMutationError = {
  message: string;
  status: 0;
  code: 'OFFLINE';
};

function rejectOfflineMutation(): void {
  if (typeof navigator === 'undefined' || navigator.onLine) return;
  throw {
    message: 'You are offline. Connect to the internet to make changes.',
    status: 0,
    code: 'OFFLINE',
  } satisfies OfflineMutationError;
}

export const httpClient = {
  get: <T>(url: string, init?: Omit<RequestInit, 'method'>) => request<T>(url, { ...(init ?? {}), method: 'GET' }),
  post: <T>(url: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) => {
    rejectOfflineMutation();
    return request<T>(url, { ...(init ?? {}), method: 'POST', body: body == null ? undefined : JSON.stringify(body) });
  },
  put: <T>(url: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) => {
    rejectOfflineMutation();
    return request<T>(url, { ...(init ?? {}), method: 'PUT', body: body == null ? undefined : JSON.stringify(body) });
  },
  patch: <T>(url: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) => {
    rejectOfflineMutation();
    return request<T>(url, { ...(init ?? {}), method: 'PATCH', body: body == null ? undefined : JSON.stringify(body) });
  },
  postForm: <T>(url: string, formData: FormData, init?: Omit<RequestInit, 'method' | 'body'>) => {
    rejectOfflineMutation();
    return request<T>(url, { ...(init ?? {}), method: 'POST', body: formData });
  },
  delete: <T>(url: string, init?: Omit<RequestInit, 'method'>) => {
    rejectOfflineMutation();
    return request<T>(url, { ...(init ?? {}), method: 'DELETE' });
  },
};
