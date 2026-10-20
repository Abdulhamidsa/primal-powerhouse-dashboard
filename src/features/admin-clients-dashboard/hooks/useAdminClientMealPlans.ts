'use client';

import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import {
  buildAdminClientMealPlansUrl,
  getAdminClientMealPlans,
} from '@/features/admin-clients-dashboard/api/adminClientMealPlans.api';
import type { AdminClientMealPlan } from '@/features/admin-clients-dashboard/types/adminClientMealPlan.types';

export function useAdminClientMealPlans(clientId: string | null) {
  const key = clientId ? buildAdminClientMealPlansUrl(clientId) : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR<AdminClientMealPlan[], ApiError>(
    key,
    () => getAdminClientMealPlans(clientId as string),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60_000,
    },
  );

  return {
    mealPlans: data ?? [],
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
    mutate,
  };
}
