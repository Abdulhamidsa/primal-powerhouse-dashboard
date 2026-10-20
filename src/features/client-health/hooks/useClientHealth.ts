'use client';

import useSWR from 'swr';
import type { ApiError } from '@/lib/request';
import { buildClientHealthUrl, getClientHealth } from '@/features/client-health/api/clientHealth.api';

export function useClientHealth(clientId: string) {
  const key = clientId ? buildClientHealthUrl(clientId) : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(key, () => getClientHealth(clientId), {
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    dedupingInterval: 60_000,
  });

  return {
    data,
    error: error as ApiError | undefined,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}
