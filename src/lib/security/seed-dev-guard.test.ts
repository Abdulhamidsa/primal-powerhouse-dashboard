import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertDevelopmentSeed } from '../../../scripts/seed-dev-guard';

describe('development seed guard', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('rejects production execution before database work', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => assertDevelopmentSeed()).toThrow('cannot run in production');
  });

  it('allows non-production execution', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(() => assertDevelopmentSeed()).not.toThrow();
  });
});
