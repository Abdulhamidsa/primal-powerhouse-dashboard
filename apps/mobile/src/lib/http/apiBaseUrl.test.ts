import { describe, expect, it } from 'vitest';
import { isAllowedApiBaseUrl } from './apiBaseUrl';

describe('isAllowedApiBaseUrl', () => {
  it('allows HTTPS on every platform', () => {
    expect(isAllowedApiBaseUrl('https://api.example.test', { development: false, platform: 'ios' })).toBe(true);
  });

  it.each(['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000'])(
    'allows development Expo Web to use loopback HTTP: %s',
    value => {
      expect(isAllowedApiBaseUrl(value, { development: true, platform: 'web' })).toBe(true);
    },
  );

  it('rejects loopback HTTP for native and production builds', () => {
    expect(isAllowedApiBaseUrl('http://localhost:3000', { development: true, platform: 'ios' })).toBe(false);
    expect(isAllowedApiBaseUrl('http://localhost:3000', { development: false, platform: 'web' })).toBe(false);
  });

  it('rejects deceptive or malformed HTTP hosts', () => {
    expect(isAllowedApiBaseUrl('http://localhost.example.test:3000', { development: true, platform: 'web' })).toBe(false);
    expect(isAllowedApiBaseUrl('not-a-url', { development: true, platform: 'web' })).toBe(false);
  });
});
