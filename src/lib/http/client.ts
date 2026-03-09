import { request } from '@/lib/request';

export const httpClient = {
  get: <T>(url: string, init?: Omit<RequestInit, 'method'>) => request<T>(url, { ...(init ?? {}), method: 'GET' }),
  post: <T>(url: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>(url, {
      ...(init ?? {}),
      method: 'POST',
      body: body == null ? undefined : JSON.stringify(body),
    }),
  put: <T>(url: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>(url, {
      ...(init ?? {}),
      method: 'PUT',
      body: body == null ? undefined : JSON.stringify(body),
    }),
  patch: <T>(url: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>(url, {
      ...(init ?? {}),
      method: 'PATCH',
      body: body == null ? undefined : JSON.stringify(body),
    }),
  postForm: <T>(url: string, formData: FormData, init?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>(url, {
      ...(init ?? {}),
      method: 'POST',
      body: formData,
    }),
  delete: <T>(url: string, init?: Omit<RequestInit, 'method'>) =>
    request<T>(url, { ...(init ?? {}), method: 'DELETE' }),
};
