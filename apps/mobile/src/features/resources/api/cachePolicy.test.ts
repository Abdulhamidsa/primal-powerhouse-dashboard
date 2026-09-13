import { expect, it } from 'vitest';
import { shouldRefreshResource } from './cachePolicy';

it('refreshes the changed feature and Today without reloading unrelated tabs', () => {
  const match = (path: string) => shouldRefreshResource(`primal:a:resource:${path}`, 'a', ['/api/user/training']);
  expect(match('/api/user/training/sessions/session-a')).toBe(true);
  expect(match('/api/user/training/history?limit=10')).toBe(true);
  expect(match('/api/user/dashboard/summary')).toBe(true);
  expect(match('/api/conversations')).toBe(false);
  expect(match('/api/user/meals/options')).toBe(false);
  expect(match('/api/user/training-other')).toBe(false);
});

it('never invalidates another account or non-resource cache entries', () => {
  expect(shouldRefreshResource('primal:b:resource:/api/user/training', 'a', ['/api/user/training'])).toBe(false);
  expect(shouldRefreshResource('primal:a:draft:training', 'a', ['/api/user/training'])).toBe(false);
  expect(shouldRefreshResource(null, 'a', ['/api/user/training'])).toBe(false);
});
