import { describe, expect, it } from 'vitest';
import { getClientDisplayName } from './client-display-name';
import { hasVerifiedRecoveryEmail } from './auth/recovery-status';

describe('getClientDisplayName', () => {
  it('uses the raw name before username and email fallbacks', () => {
    expect(getClientDisplayName({ name: '  Real Name ', username: 'handle', email: 'mail@example.com' })).toBe('Real Name');
  });

  it('uses username, email prefix, then Member', () => {
    expect(getClientDisplayName({ name: null, username: 'handle', email: 'mail@example.com' })).toBe('handle');
    expect(getClientDisplayName({ name: null, username: null, email: 'mail@example.com' })).toBe('mail');
    expect(getClientDisplayName({ name: null, username: null, email: null })).toBe('Member');
  });

  it('enables recovery only for a present verified email', () => {
    expect(hasVerifiedRecoveryEmail({ email: 'member@example.com', emailVerifiedAt: new Date() })).toBe(true);
    expect(hasVerifiedRecoveryEmail({ email: null, emailVerifiedAt: new Date() })).toBe(false);
    expect(hasVerifiedRecoveryEmail({ email: 'member@example.com', emailVerifiedAt: null })).toBe(false);
  });
});
