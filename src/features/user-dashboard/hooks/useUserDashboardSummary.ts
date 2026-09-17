'use client';

import { useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/fetcher';
import { getUserDashboardSummary, USER_DASHBOARD_SUMMARY_URL } from '@/features/user-dashboard/api/userDashboard.api';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';

export function useUserDashboardSummary(enabled = true) {
  const { mutate: globalMutate } = useSWRConfig();
  const { data, error, isLoading, isValidating, mutate } = useSWR<UserDashboardSummary, ApiError>(
    enabled ? USER_DASHBOARD_SUMMARY_URL : null,
    getUserDashboardSummary,
    {
      keepPreviousData: true,
      revalidateOnMount: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      dedupingInterval: 2_000,
    },
  );

  useEffect(() => {
    if (!data) return;

    globalMutate(
      '/api/user/data',
      {
        name: data.user.name,
        avatar: data.user.avatar,
        motivationalMessage: data.user.motivationalMessage ?? undefined,
        goalWeight: data.user.goalWeight,
      },
      false,
    );
  }, [data, globalMutate]);

  return {
    summary: data ?? null,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}
