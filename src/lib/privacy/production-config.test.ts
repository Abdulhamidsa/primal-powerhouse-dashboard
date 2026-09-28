import { afterEach, describe, expect, it } from 'vitest';
import { validateProductionConfig } from '../../../scripts/validate-production-config.ts';

const originalEnvironment = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(originalEnvironment)) process.env[key] = value;
});

function setValidProductionEnvironment() {
  Object.assign(process.env, {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://app:secret@db.primal.test:5432/primal',
    DIRECT_URL: 'postgresql://app:secret@db.primal.test:5432/primal',
    JWT_SECRET: 'a'.repeat(48),
    APP_BASE_URL: 'https://app.primal.test',
    FIELD_ENCRYPTION_MASTER_KEY_BASE64: Buffer.alloc(32, 1).toString('base64'),
    PRIVACY_DELETION_GRACE_DAYS: '30',
    PRIVACY_EXPORT_EXPIRY_HOURS: '24',
    PRIVACY_AUDIT_RETENTION_DAYS: '365',
  });
}

describe('production configuration validation', () => {
  it('accepts a complete minimal production configuration', () => {
    setValidProductionEnvironment();
    expect(validateProductionConfig()).toEqual(expect.any(Array));
  });

  it('rejects a weak authentication secret before deployment', () => {
    setValidProductionEnvironment();
    process.env.JWT_SECRET = 'short';
    expect(() => validateProductionConfig()).toThrow('JWT_SECRET');
  });
});
