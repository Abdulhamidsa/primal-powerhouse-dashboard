export const OFFLINE_SCHEMA_VERSION = 1;
export const OFFLINE_METADATA_KEY = 'primal-powerhouse-offline-metadata';

const CACHEABLE_USER_API_PATTERNS = [
  /^\/api\/auth\/me$/,
  /^\/api\/user\/dashboard\/summary$/,
  /^\/api\/user\/meals\/(summary|selection|options|shopping-list)$/,
  /^\/api\/user\/training\/plan(?:\/day)?$/,
  /^\/api\/user\/workout-assignments$/,
  /^\/api\/user\/videos(?:\/[^/]+)?$/,
  /^\/api\/user\/(daily-checkins\/current|daily-checkins\/insights|daily-nutrition\/current|daily-training\/current|weekly-checkins\/current|adherence\/current)$/,
  /^\/api\/meals\/[^/]+$/,
];

export function isCacheableUserApiPath(pathname: string): boolean {
  return CACHEABLE_USER_API_PATTERNS.some(pattern => pattern.test(pathname));
}

export function offlineUserCacheSuffix(userId: string): string {
  return encodeURIComponent(userId);
}

export function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}
