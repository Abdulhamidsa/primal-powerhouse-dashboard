'use client';

import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import {
  buildClientDetailUrl,
  getAdminClientDetail,
} from '@/features/admin-clients-dashboard/api/adminClientsDashboard.api';
import type { AdminClientDetail } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';

export function useSelectedClientDashboard(clientId: string | null) {
  const key = clientId ? buildClientDetailUrl(clientId) : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<AdminClientDetail, ApiError>(key, () =>
    getAdminClientDetail(clientId as string)
  );

  return {
    client: data ?? null,
    error,
    isLoading,
    isValidating,
    mutate,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}
