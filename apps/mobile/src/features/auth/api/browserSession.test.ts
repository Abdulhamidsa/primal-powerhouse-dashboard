import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('./sessionStorage', () => import('./sessionStorage.web'));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getAllKeys: async () => [], multiRemove: async () => {} },
}));
vi.mock('@react-native-community/netinfo', () => ({
  default: { fetch: async () => ({ isConnected: true, isInternetReachable: true }) },
}));
const values = new Map<string, string>();
const session = {
  user: { id: 'browser-client', name: 'Test', email: 'test@example.test' },
  accessToken: 'access', refreshToken: 'refresh', expiresIn: 900,
};
beforeEach(() => {
  vi.resetModules();
  values.clear();
  vi.stubGlobal('window', { sessionStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } });
  vi.stubEnv('EXPO_PUBLIC_API_URL', 'https://api.example.test');
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('restores a browser login after reload and removes it on logout', async () => {
  const first = await import('./sessionStore');
  await first.saveSession(session);
  vi.resetModules();
  const reloaded = await import('./sessionStore');
  await reloaded.restoreSession();
  expect(reloaded.getAuthState().session).toEqual(session);
  await reloaded.saveSession(null);
  expect(values.size).toBe(0);
  vi.resetModules();
  const loggedOut = await import('./sessionStore');
  await loggedOut.restoreSession();
  expect(loggedOut.getAuthState().session).toBeNull();
});

it('persists rotated credentials after an expired API request', async () => {
  const store = await import('./sessionStore');
  await store.saveSession(session);
  const next = { ...session, accessToken: 'next-access', refreshToken: 'next-refresh' };
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce(new Response('{}', { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(next), { headers: { 'content-type': 'application/json' } }))
    .mockResolvedValueOnce(new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } })));
  const { httpClient } = await import('@/lib/http/client');
  await expect(httpClient.get('/api/test')).resolves.toEqual({ ok: true });
  expect(JSON.parse(values.get('primal.session.v1')!)).toEqual(next);
});

it('reports blocked storage without marking login successful', async () => {
  vi.stubGlobal('window', { get sessionStorage() { throw new Error('Denied'); } });
  const store = await import('./sessionStore');
  await expect(store.saveSession(session)).rejects.toThrow('Allow site storage');
  expect(store.getAuthState().session).toBeNull();
});

it('restores safely during web server rendering', async () => {
  vi.stubGlobal('window', undefined);
  const store = await import('./sessionStore');
  await store.restoreSession();
  expect(store.getAuthState()).toEqual({ session: null, ready: true });
});
