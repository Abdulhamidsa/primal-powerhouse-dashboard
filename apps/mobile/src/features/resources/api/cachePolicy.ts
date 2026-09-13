export function shouldRefreshResource(key: unknown, userId: string, paths: readonly string[]) {
  if (typeof key !== 'string') return false;
  const prefix = `primal:${userId}:resource:`;
  if (!key.startsWith(prefix)) return false;
  const resource = key.slice(prefix.length);
  return ['/api/user/dashboard/summary', ...paths].some(
    path => resource === path || resource.startsWith(`${path}/`) || resource.startsWith(`${path}?`),
  );
}
