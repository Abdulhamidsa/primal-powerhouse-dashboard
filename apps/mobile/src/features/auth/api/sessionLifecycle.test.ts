import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  secureWrite: vi.fn(),
  secureDelete: vi.fn(),
  secureRead: vi.fn(),
  asyncKeys: vi.fn(async () => [] as string[]),
  asyncRemove: vi.fn(),
  fetch: vi.fn(),
}));
vi.mock('expo-secure-store', () => ({
  setItemAsync: mocks.secureWrite,
  deleteItemAsync: mocks.secureDelete,
  getItemAsync: mocks.secureRead,
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getAllKeys: mocks.asyncKeys, multiRemove: mocks.asyncRemove },
}));
vi.mock('@react-native-community/netinfo', () => ({
  default: { fetch: vi.fn(async () => ({ isConnected: true, isInternetReachable: true })) },
}));

const session = (id: string, version = '1') => ({
  user: { id, name: id, email: `${id}@example.test` },
  accessToken: `${id}-access-${version}`,
  refreshToken: `${id}-refresh-${version}`,
  expiresIn: 900,
});
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.secureWrite.mockResolvedValue(undefined);
  mocks.secureDelete.mockResolvedValue(undefined);
  mocks.asyncKeys.mockResolvedValue([]);
  mocks.asyncRemove.mockResolvedValue(undefined);
  process.env.EXPO_PUBLIC_API_URL = 'https://mobile-api.example.test';
  vi.stubGlobal('fetch', mocks.fetch);
});

it('shares one rotating refresh across simultaneous expired requests', async () => {
  const store = await import('./sessionStore');
  const { httpClient } = await import('@/lib/http/client');
  await store.saveSession(session('a'));
  mocks.fetch.mockImplementation(async (url: string, init: RequestInit) => {
    if (url.endsWith('/refresh')) return json(session('a', '2'));
    return new Headers(init.headers).get('authorization')?.endsWith('access-2') ? json({ ok: true }) : json({}, 401);
  });
  await expect(Promise.all([httpClient.get('/api/one'), httpClient.get('/api/two')])).resolves.toEqual([
    { ok: true },
    { ok: true },
  ]);
  expect(mocks.fetch.mock.calls.filter(([url]) => url.endsWith('/refresh'))).toHaveLength(1);
  expect(store.getAuthState().session?.refreshToken).toBe('a-refresh-2');
});

it.each(['a', 'b'])('does not replay a pending mutation after signing in as %s', async nextUser => {
  const store = await import('./sessionStore');
  const { httpClient } = await import('@/lib/http/client');
  await store.saveSession(session('a'));
  const pending = deferred<Response>();
  mocks.fetch.mockReturnValueOnce(pending.promise);
  const request = httpClient.send('/api/check-in', 'PUT', { note: 'Account a draft' });
  const rejection = expect(request).rejects.toThrow('Your session changed');
  await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1));
  await store.saveSession(session(nextUser, 'new-login'));
  pending.resolve(json({}, 401));
  await rejection;
  expect(mocks.fetch).toHaveBeenCalledTimes(1);
  expect(store.getAuthState().session?.refreshToken).toBe(`${nextUser}-refresh-new-login`);
});

it('does not let an old refresh failure sign out a newly logged-in account', async () => {
  const store = await import('./sessionStore');
  const { httpClient } = await import('@/lib/http/client');
  await store.saveSession(session('a'));
  const pending = deferred<Response>();
  mocks.fetch.mockResolvedValueOnce(json({}, 401)).mockReturnValueOnce(pending.promise);
  const request = httpClient.get('/api/one');
  const rejection = expect(request).rejects.toThrow();
  await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(2));
  await store.saveSession(session('b'));
  pending.resolve(json({}, 401));
  await rejection;
  expect(store.getAuthState().session?.user.id).toBe('b');
  expect(mocks.secureDelete).not.toHaveBeenCalled();
});

it('rejects a stale successful response after logout', async () => {
  const store = await import('./sessionStore');
  const { httpClient } = await import('@/lib/http/client');
  await store.saveSession(session('a'));
  const pending = deferred<Response>();
  mocks.fetch.mockReturnValueOnce(pending.promise);
  const request = httpClient.get('/api/profile');
  const rejection = expect(request).rejects.toThrow('Your session changed');
  await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1));
  await store.saveSession(null);
  pending.resolve(json({ private: 'old account data' }));
  await rejection;
});

it('serializes credential writes so a slow old write cannot restore a logged-out session', async () => {
  const store = await import('./sessionStore');
  const pending = deferred<void>();
  mocks.secureWrite.mockReturnValueOnce(pending.promise);
  const first = store.saveSession(session('a'));
  await vi.waitFor(() => expect(mocks.secureWrite).toHaveBeenCalledTimes(1));
  const logout = store.saveSession(null);
  pending.resolve();
  await Promise.all([first, logout]);
  expect(store.getAuthState().session).toBeNull();
  expect(mocks.secureDelete).toHaveBeenCalledTimes(1);
});

it('removes only the previous account cache when another client signs in', async () => {
  const store = await import('./sessionStore');
  await store.saveSession(session('a'));
  mocks.asyncKeys.mockResolvedValue([
    'primal:a:resource:/api/user/dashboard/summary',
    'primal:a:draft:weekly:2026-09-07',
    'primal:a:pending-message:conversation-a',
    'primal:b:resource:/api/user/dashboard/summary',
    'primal:theme',
  ]);

  await store.saveSession(session('b'));

  expect(mocks.asyncRemove).toHaveBeenCalledWith([
    'primal:a:resource:/api/user/dashboard/summary',
    'primal:a:draft:weekly:2026-09-07',
    'primal:a:pending-message:conversation-a',
  ]);
  expect(store.getAuthState().session?.user.id).toBe('b');
});

it('clears cached account data when refresh confirms the session was revoked', async () => {
  const store = await import('./sessionStore');
  const { httpClient } = await import('@/lib/http/client');
  await store.saveSession(session('a'));
  const accountKeys = [
    'primal:a:resource:/api/user/dashboard/summary',
    'primal:a:draft:feedback',
    'primal:a:pending-message:conversation-a',
  ];
  mocks.asyncKeys.mockResolvedValue(accountKeys);
  mocks.fetch.mockResolvedValue(json({}, 401));

  await expect(httpClient.get('/api/private')).rejects.toThrow();

  expect(store.getAuthState().session).toBeNull();
  expect(mocks.secureDelete).toHaveBeenCalledTimes(1);
  expect(mocks.asyncRemove).toHaveBeenCalledWith(accountKeys);
});
