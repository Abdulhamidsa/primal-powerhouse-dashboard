export type ApiError = {
  message: string;
  status: number;
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
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {}

    throw { message, status: res.status };
  }

  return (await res.json()) as T;
}

