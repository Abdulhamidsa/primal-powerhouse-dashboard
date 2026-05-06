import useSWR from 'swr';
import type { ApiError } from '@/lib/request';
import { getUserMealDetail, USER_MEAL_DETAIL_URL } from '@/features/meals/api/mealDetail.api';
import type { MealDetail } from '@/features/meals/types/mealDetail.types';

export function useMealDetail(mealId?: string) {
  const { data, error, isLoading, isValidating } = useSWR<MealDetail, ApiError>(
    mealId ? [USER_MEAL_DETAIL_URL, mealId] : null,
    ([, currentMealId]: [string, string]) => getUserMealDetail(currentMealId),
  );

  return {
    meal: data,
    error,
    isLoading,
    isValidating,
  };
}