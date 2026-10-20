'use client';

import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import { buildClientHealthMetricsUrl, getLatestClientHealthMetrics } from '@/features/health-metrics/api/healthMetrics.api';
import type { LatestHealthMetric } from '@/features/health-metrics/types/latestHealthMetric.types';

export function useLatestClientHealthMetrics(clientId: string | null) {
  const key = clientId ? `${buildClientHealthMetricsUrl(clientId)}?limit=1` : null;
  const { data, error, isLoading, mutate } = useSWR<LatestHealthMetric[], ApiError>(
    key,
    () => getLatestClientHealthMetrics(clientId as string),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60_000,
    },
  );

  return {
    latest: data?.[0] ?? null,
    error,
    isLoading,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}
