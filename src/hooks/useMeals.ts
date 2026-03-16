import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { ApiError } from '@/lib/fetcher';
import type { MealListItem } from '@/lib/meal-planner/types';

export function useMeals() {
  const key = '/api/meals';

  const { data, error, isLoading, mutate, isValidating } = useSWR<MealListItem[], ApiError>(key, fetcher);

  return {
    meals: data ?? [],
    error,
    isLoading,
    isValidating,
    refreshMeals: () => mutate(undefined, { revalidate: true }),
    mutateMeals: mutate,
  };
}
