import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ client: { findUnique: vi.fn() } }));
vi.mock('@/lib/prisma', () => ({ prisma: database }));

import { normalizeUsername, suggestUsernames, validateUsername } from './username.server';
import { classifyIdentifier, normalizeIdentifier } from './identifier.server';
import { requiresEmailVerification, requiresEmailVerificationForIdentifier } from '@/lib/auth/client-verification';

describe('username rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.client.findUnique.mockResolvedValue(null);
  });

  it('normalizes case and whitespace', () => {
    expect(normalizeUsername('  GhostRep82 ')).toBe('ghostrep82');
  });

  it.each(['ab', '1strong', 'strong-name', 'strong name', 'strong@email.com'])('rejects invalid username %s', value => {
    expect(validateUsername(value)).toBeTruthy();
  });

  it.each(['admin', 'support', 'system'])('rejects reserved username %s', value => {
    expect(validateUsername(value)).toBe('That username is reserved.');
  });

  it('returns available generated suggestions', async () => {
    const result = await suggestUsernames(3);
    expect(result).toHaveLength(3);
    expect(result.every(value => validateUsername(value) === null)).toBe(true);
    expect(database.client.findUnique).toHaveBeenCalled();
  });

  it('normalizes email and username login identifiers consistently', () => {
    expect(classifyIdentifier('USER@example.com')).toBe('email');
    expect(normalizeIdentifier(' USER@example.com ')).toBe('user@example.com');
    expect(classifyIdentifier('GhostRep82')).toBe('username');
    expect(normalizeIdentifier(' GhostRep82 ')).toBe('ghostrep82');
  });

  it('keeps username accounts active while an added email is pending', () => {
    const client = { signupSource: 'USERNAME_SIGNUP', email: 'pending@example.com', emailVerifiedAt: null };
    expect(requiresEmailVerification(client)).toBe(false);
    expect(requiresEmailVerificationForIdentifier(client, 'username')).toBe(false);
    expect(requiresEmailVerificationForIdentifier(client, 'email')).toBe(true);
  });
});
