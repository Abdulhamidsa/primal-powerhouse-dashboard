export type ApiError = {
  message: string;
  status: number; // 0 means network error / CORS / offline etc.
  url?: string;
};

type ErrorBody = {
  message?: string;
  error?: string;
  details?: string;
};

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function isJsonContentType(contentType: string): boolean {
  return contentType.toLowerCase().includes('json');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export async function fetcher<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  const method = (init.method ?? 'GET').toUpperCase();
  const body = init.body;

  const shouldSetJsonContentType =
    method !== 'GET' && method !== 'HEAD' && body != null && !isFormData(body) && !headers.has('Content-Type');

  if (shouldSetJsonContentType) {
    headers.set('Content-Type', 'application/json');
  }

  let finalBody: BodyInit | null | undefined = init.body as BodyInit | null | undefined;

  if (shouldSetJsonContentType && isPlainObject(body)) {
    finalBody = JSON.stringify(body);
  }

  let res: Response;

  try {
    res = await fetch(url, {
      ...init,
      body: finalBody,
      credentials: 'include',
      cache: 'no-store',
      headers,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw e;
    }

    const err: ApiError = {
      message: 'Network error. Check your connection or try again.',
      status: 0,
      url,
    };
    throw err;
  }

  if (!res.ok) {
    let message = 'Request failed';

    const contentType = res.headers.get('content-type') ?? '';
    try {
      if (isJsonContentType(contentType)) {
        const data = (await res.json()) as ErrorBody;
        message = data.message || data.error || message;
        if (data.details) message = `${message}: ${data.details}`;
      } else {
        const text = await res.text();
        if (text) message = text;
      }
    } catch {}

    const err: ApiError = { message, status: res.status, url };
    throw err;
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') ?? '';
  if (!isJsonContentType(contentType)) {
    return (await res.text()) as unknown as T;
  }

  return (await res.json()) as T;
}
