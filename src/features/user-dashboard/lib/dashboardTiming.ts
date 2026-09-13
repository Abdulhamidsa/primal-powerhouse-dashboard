export function measureDashboardOperation<T>(name: string, operation: T): Promise<Awaited<T>> {
  const started = performance.now();
  return Promise.resolve(operation).finally(() => {
    if (process.env.LOG_DASHBOARD_TIMINGS === 'true') {
      console.info('[DASHBOARD_QUERY_TIMING]', { operation: name, durationMs: Math.round(performance.now() - started) });
    }
  });
}
