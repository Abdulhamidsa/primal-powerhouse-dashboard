import { afterEach, describe, expect, it } from 'vitest';
import { getPrivacyRetentionConfig, validatePrivacyRetentionConfig } from './retention-config';

const originalEnvironment = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(originalEnvironment)) process.env[key] = value;
});

describe('privacy retention configuration', () => {
  it('uses the contractual defaults outside production', () => {
    delete process.env.PRIVACY_DELETION_GRACE_DAYS;
    delete process.env.PRIVACY_EXPORT_EXPIRY_HOURS;
    delete process.env.PRIVACY_AUDIT_RETENTION_DAYS;

    expect(getPrivacyRetentionConfig({ NODE_ENV: 'test' })).toEqual({
      deletionGraceDays: 30,
      exportExpiryHours: 24,
      auditRetentionDays: 365,
    });
  });

  it('rejects missing or divergent production values', () => {
    const environment = {
      NODE_ENV: 'production',
      PRIVACY_DELETION_GRACE_DAYS: '30',
      PRIVACY_EXPORT_EXPIRY_HOURS: '24',
      PRIVACY_AUDIT_RETENTION_DAYS: '364',
    };

    expect(() => validatePrivacyRetentionConfig(environment)).toThrow('365');
    expect(() => validatePrivacyRetentionConfig({ NODE_ENV: 'production' })).toThrow('required');
  });
});
