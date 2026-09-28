import { describe, expect, it } from 'vitest';
import { isCacheableUserApiPath, offlineUserCacheSuffix } from '@/features/offline/lib/offlinePolicy';

describe('offline policy', () => {
  it('allows only the user read endpoints needed offline', () => {
    expect(isCacheableUserApiPath('/api/user/dashboard/summary')).toBe(true);
    expect(isCacheableUserApiPath('/api/user/meals/shopping-list')).toBe(true);
    expect(isCacheableUserApiPath('/api/user/chat')).toBe(false);
    expect(isCacheableUserApiPath('/api/admin/clients')).toBe(false);
  });

  it('creates a stable cache-safe user namespace', () => {
    expect(offlineUserCacheSuffix('client/a@example.com')).toBe('client%2Fa%40example.com');
  });
});
