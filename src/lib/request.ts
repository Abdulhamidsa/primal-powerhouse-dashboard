export type ApiError = {
  message: string;
  status: number;
};

type ErrorBody = {
  message?: string;
  error?: string;
  details?: string;
};

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

export async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  const method = (init.method ?? 'GET').toUpperCase();
  const body = init.body;

  const shouldSetJson =
    method !== 'GET' && method !== 'HEAD' && body != null && !isFormData(body) && !headers.has('Content-Type');

  if (shouldSetJson) headers.set('Content-Type', 'application/json');

  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    let message = 'Request failed';

    const ct = res.headers.get('content-type') ?? '';
    try {
      if (ct.includes('application/json')) {
        const data = (await res.json()) as ErrorBody;
        message = data.message || data.error || message;
        if (data.details) message = `${message}: ${data.details}`;
      } else {
        const text = await res.text();
        if (text) message = text;
      }
    } catch {}

    throw { message, status: res.status } satisfies ApiError;
  }

  if (res.status === 204) return undefined as T;

  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    return (await res.text()) as unknown as T;
  }

  return (await res.json()) as T;
}
