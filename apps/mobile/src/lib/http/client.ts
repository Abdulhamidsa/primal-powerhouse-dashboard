import NetInfo from '@react-native-community/netinfo';
import { getAuthState, getSessionGeneration, saveSession } from '@/features/auth/api/sessionStore';
import type { Session } from '@/features/auth/types/auth.types';
import { isAllowedApiBaseUrl } from './apiBaseUrl';

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}
export function apiBaseUrl() {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (
    !base ||
    !isAllowedApiBaseUrl(base, {
      development: process.env.NODE_ENV !== 'production',
      platform: typeof window !== 'undefined' && typeof document !== 'undefined' ? 'web' : 'native',
    })
  )
    throw new ApiError(
      'Set EXPO_PUBLIC_API_URL to HTTPS. Local HTTP is available only to Expo Web in development.',
    );
  return base;
}
let refresh: { generation: number; promise: Promise<Session> } | null = null;
async function transport<T>(path: string, init: RequestInit = {}, authenticated = true, retry = true): Promise<T> {
  if (!path.startsWith('/api/')) throw new ApiError('Invalid API path');
  const generation = getSessionGeneration();
  const session = getAuthState().session;
  const assertCurrentAccount = () => {
    if (authenticated && generation !== getSessionGeneration())
      throw new ApiError('Your session changed. Please reopen this screen.', 401);
  };
  const network = await NetInfo.fetch();
  assertCurrentAccount();
  if (network.isConnected === false || network.isInternetReachable === false)
    throw new ApiError('You are offline. Your draft has not been submitted.');
  const headers = new Headers(init.headers);
  if (authenticated && session) headers.set('Authorization', `Bearer ${session.accessToken}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.body instanceof FormData ? 120000 : 25000);
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers,
      credentials: 'omit',
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('Connection interrupted. Please retry; your draft is kept.');
  } finally {
    clearTimeout(timeout);
  }
  assertCurrentAccount();
  if (response.status === 401 && authenticated && session && retry) {
    // Another request may already have rotated this session while ours was in flight.
    if (getAuthState().session?.accessToken !== session.accessToken)
      return transport<T>(path, init, authenticated, false);
    if (!refresh || refresh.generation !== generation) {
      const promise = transport<Session>(
        '/api/auth/mobile/refresh',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        },
        false,
      )
        .then(async next => {
          if (generation === getSessionGeneration()) await saveSession(next, session.refreshToken);
          return next;
        })
        .catch(async error => {
          if (generation === getSessionGeneration() && error instanceof ApiError && error.status === 401)
            await saveSession(null, session.refreshToken);
          throw error;
        })
        .finally(() => {
          if (refresh?.promise === promise) refresh = null;
        });
      refresh = { generation, promise };
    }
    await refresh.promise;
    assertCurrentAccount();
    return transport<T>(path, init, authenticated, false);
  }
  const data =
    response.status === 204
      ? undefined
      : response.headers.get('content-type')?.includes('json')
        ? await response.json()
        : await response.text();
  assertCurrentAccount();
  if (!response.ok)
    throw new ApiError(data?.error || data?.message || 'Request failed. Please retry.', response.status);
  return data as T;
}
export const httpClient = {
  get: <T>(path: string) => transport<T>(path),
  send: <T>(path: string, method: string, body?: unknown, authenticated = true) =>
    transport<T>(
      path,
      {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      authenticated,
    ),
  postForm: <T>(path: string, body: FormData) => transport<T>(path, { method: 'POST', body }),
};
