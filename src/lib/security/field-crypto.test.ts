import { beforeEach, describe, expect, it } from 'vitest';
import { decryptField, decryptOrFallback, encryptField, isEncryptedPayload } from '@/lib/security/field-crypto';

describe('field-crypto', () => {
  beforeEach(() => {
    process.env.FIELD_ENCRYPTION_MASTER_KEY_BASE64 = Buffer.from('12345678901234567890123456789012').toString('base64');
    process.env.FIELD_ENCRYPTION_KEY_VERSION = 'v1';
  });

  it('encrypts and decrypts with same context', () => {
    const context = 'client:test:notes';
    const plaintext = 'Sensitive note';

    const encrypted = encryptField(plaintext, context);
    const decrypted = decryptField(encrypted, context);

    expect(encrypted).not.toBe(plaintext);
    expect(decrypted).toBe(plaintext);
  });

  it('detects encrypted payload and decryptOrFallback behavior', () => {
    const context = 'weeklyCheckIn:abc:notes';
    const plaintext = 'Weekly private notes';

    const encrypted = encryptField(plaintext, context);

    expect(isEncryptedPayload(encrypted)).toBe(true);
    expect(decryptOrFallback(encrypted, context)).toBe(plaintext);
    expect(decryptOrFallback(plaintext, context)).toBe(plaintext);
    expect(decryptOrFallback(null, context)).toBeNull();
  });

  it('fails decryption for wrong context', () => {
    const encrypted = encryptField('secret', 'context:one');

    expect(() => decryptField(encrypted, 'context:two')).toThrow();
  });
});
