const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function isAllowedApiBaseUrl(
  value: string,
  runtime: { development: boolean; platform: string },
): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return true;
    return (
      runtime.development &&
      runtime.platform === 'web' &&
      url.protocol === 'http:' &&
      loopbackHosts.has(url.hostname)
    );
  } catch {
    return false;
  }
}
