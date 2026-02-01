import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import { MealAssignment } from '@/lib/client-page/types';

/**
 * Custom hook to fetch meal assignments for a specific client
 * @param clientId - The ID of the client to fetch meals for
 * @returns Meal assignments data, loading state, error, and refresh function
 */
export function useClientMeals(clientId: string | null) {
  const key = clientId ? `/api/meal-plans?clientId=${clientId}` : null;

  const { data, error, isLoading, mutate, isValidating } = useSWR<MealAssignment[], ApiError>(
    key,
    async (url: string) => {
      const response = await fetch(url);

      if (!response.ok) {
        console.warn('Failed to fetch meal plans');
        return [];
      }

      const mealPlans = await response.json();

      if (!Array.isArray(mealPlans)) {
        console.warn('Meal plans response is not an array');
        return [];
      }

      // Transform meal plans into flat list of meal assignments
      const allAssignments: MealAssignment[] = [];

      mealPlans.forEach(
        (plan: {
          startDate: string;
          endDate?: string;
          mealAssignments?: {
            id: string;
            mealId: string;
            notes?: string;
            meal: MealAssignment['meal'];
          }[];
        }) => {
          if (!plan.mealAssignments || !Array.isArray(plan.mealAssignments)) {
            return;
          }

          plan.mealAssignments.forEach(
            (assignment: { id: string; mealId: string; notes?: string; meal: MealAssignment['meal'] }) => {
              allAssignments.push({
                id: assignment.id,
                mealId: assignment.mealId,
                clientId: clientId!,
                assignedDate: new Date(plan.startDate),
                dueDate: plan.endDate ? new Date(plan.endDate) : undefined,
                status: 'assigned',
                notes: assignment.notes,
                meal: assignment.meal,
              });
            }
          );
        }
      );

      return allAssignments;
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return {
    meals: data || [],
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
    mutate,
  };
}
