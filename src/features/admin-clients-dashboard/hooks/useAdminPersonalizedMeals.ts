'use client';

import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import {
  buildAdminPersonalizedMealsUrl,
  getAdminPersonalizedMeals,
} from '@/features/admin-clients-dashboard/api/personalizedMeals.api';
import type { AdminPersonalizedMealsResponse } from '@/features/admin-clients-dashboard/types/personalizedMeal.types';

export function useAdminPersonalizedMeals(clientId: string | null) {
  const key = clientId ? buildAdminPersonalizedMealsUrl(clientId) : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR<AdminPersonalizedMealsResponse, ApiError>(
    key,
    () => getAdminPersonalizedMeals(clientId as string),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60_000,
    },
  );

  return {
    meals: data?.meals ?? [],
    count: data?.count ?? 0,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
    mutate,
  };
}
