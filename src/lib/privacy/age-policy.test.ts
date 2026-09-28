import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { assertAgeDeclaration, getAgePolicy } from '@/lib/privacy/age-policy';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('configurable age policy', () => {
  it('keeps existing signup behavior when no threshold is configured', () => {
    vi.stubEnv('PRIMAL_MINIMUM_AGE', '');
    expect(getAgePolicy().enabled).toBe(false);
    expect(() => assertAgeDeclaration(undefined)).not.toThrow();
  });

  it('requires an explicit declaration when enabled', () => {
    vi.stubEnv('PRIMAL_MINIMUM_AGE', '18');
    expect(getAgePolicy()).toMatchObject({ enabled: true, minimumAge: 18 });
    expect(() => assertAgeDeclaration(false)).toThrow('AGE_DECLARATION_REQUIRED');
    expect(() => assertAgeDeclaration(true)).not.toThrow();
  });
});
