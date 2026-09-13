import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
const database = vi.hoisted(() => ({ client: { findUnique: vi.fn() }, mobileSession: { findUnique: vi.fn() } }));
vi.mock('@/lib/prisma', () => ({ prisma: database }));
import { AuthService } from '@/lib/auth';
import { requireRecentClientAuth } from '@/lib/security/recent-auth';
import { assertSameOrigin } from '@/lib/security/csrf';

const secret = 'unit-test-only-secret-with-more-than-32-characters';
function token(claims: Record<string, unknown> = {}, audience = 'primal-mobile') { return jwt.sign({ userId: 'client-a', email: 'client@example.test', type: 'client', sid: 'session-a', ...claims }, secret, { audience, expiresIn: '15m' }); }
function request(bearer: string) { return new NextRequest('https://test.example/api/privacy/consent', { method: 'PUT', headers: { authorization: `Bearer ${bearer}` } }); }
beforeEach(() => {
  process.env.JWT_SECRET = secret;
  vi.clearAllMocks();
  database.client.findUnique.mockResolvedValue({ status: 'ACTIVE', deactivatedAt: null, authInvalidBefore: null });
  database.mobileSession.findUnique.mockResolvedValue({ clientId: 'client-a', revokedAt: null, expiresAt: new Date(Date.now() + 100000), authenticatedAt: new Date() });
});
describe('native sessions', () => {
  it('authenticates a valid session and permits native writes without a browser Origin', async () => {
    expect((await AuthService.validateRequestAuth(request(token()), 'client'))?.userId).toBe('client-a');
    expect(await assertSameOrigin(request(token()))).toEqual({ ok: true });
  });
  it('does not accept the wrong audience or a client session as an admin', async () => {
    expect(await AuthService.validateRequestAuth(request(token({}, 'other-app')))).toBeNull();
    expect(await AuthService.validateRequestAuth(request(token()), 'admin')).toBeNull();
  });
  it.each(['revoked', 'expired', 'other-client'])('rejects %s sessions', async kind => {
    database.mobileSession.findUnique.mockResolvedValue({ clientId: kind === 'other-client' ? 'client-b' : 'client-a', revokedAt: kind === 'revoked' ? new Date() : null, expiresAt: new Date(Date.now() + (kind === 'expired' ? -1000 : 100000)), authenticatedAt: new Date() });
    expect(await AuthService.validateRequestAuth(request(token()))).toBeNull();
  });
  it.each(['INACTIVE','ARCHIVED'])('rejects %s accounts', async status => {
    database.client.findUnique.mockResolvedValue({ status });
    expect(await AuthService.validateRequestAuth(request(token()))).toBeNull();
  });
  it('does not treat a newly refreshed access token as recent password authentication', async () => {
    database.mobileSession.findUnique.mockResolvedValue({ clientId: 'client-a', revokedAt: null, expiresAt: new Date(Date.now() + 100000), authenticatedAt: new Date(Date.now() - 3600_000) });
    expect((await requireRecentClientAuth(request(token()))).ok).toBe(false);
  });
  it('retains CSRF protection for invalid bearer and browser requests', async () => {
    expect((await assertSameOrigin(request('invalid'))).ok).toBe(false);
    expect((await assertSameOrigin(new NextRequest('https://test.example/api/privacy/consent', { method: 'PUT', headers: { origin: 'https://attacker.example' } }))).ok).toBe(false);
  });
  it('rejects native access tokens presented as browser cookies', () => { expect(AuthService.verifyToken(token())).toBeNull(); });
  it('invalidates old browser sessions after logout-all', async () => {
    const cookie = AuthService.generateToken({ userId: 'client-a', email: 'client@example.test', type: 'client' });
    database.client.findUnique.mockResolvedValue({ status: 'ACTIVE', authInvalidBefore: new Date(Date.now() + 1000) });
    const browser = new NextRequest('https://test.example/api/user/data', { headers: { cookie: `auth-token-client=${cookie}` } });
    expect(await AuthService.validateRequestAuth(browser, 'client')).toBeNull();
  });
  it('does not issue tokens without a configured secret', () => {
    delete process.env.JWT_SECRET;
    expect(() => AuthService.generateToken({ userId: 'a', email: 'a@example.test', type: 'client' })).toThrow();
  });
});
