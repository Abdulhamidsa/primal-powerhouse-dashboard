export type ApiError = {
  message: string;
  status: number;
};

type ErrorBody = {
  message?: string;
  error?: string;
  details?: string;
};

export async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = 'Request failed';

    try {
      const data = (await res.json()) as ErrorBody;
      message = data.message || data.error || message;
      if (data.details) message = `${message}: ${data.details}`;
    } catch {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {}
    }

    throw { message, status: res.status } satisfies ApiError;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
