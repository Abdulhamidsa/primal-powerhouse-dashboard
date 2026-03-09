'use client';

import useSWR from 'swr';
import type { ApiError } from '@/lib/request';
import {
  buildClientNutritionComparisonUrl,
  getClientNutritionComparison,
} from '@/features/client-nutrition-comparison/api/clientNutritionComparison.api';

export function useClientNutritionComparison(clientId: string) {
  const key = clientId ? buildClientNutritionComparisonUrl(clientId) : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(key, () => getClientNutritionComparison(clientId), {
    revalidateOnFocus: false,
  });

  return {
    data,
    error: error as ApiError | undefined,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}
