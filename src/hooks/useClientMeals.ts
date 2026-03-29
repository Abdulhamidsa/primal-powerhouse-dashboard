import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import { ActiveMealPlanSummary, MealAssignment } from '@/lib/client-page/types';

/**
 * Custom hook to fetch meal assignments for a specific client
 * @param clientId - The ID of the client to fetch meals for
 * @returns Meal assignments data, loading state, error, and refresh function
 */
export function useClientMeals(clientId: string | null) {
  const key = clientId ? `/api/meal-plans?clientId=${clientId}` : null;

  type UseClientMealsData = {
    assignments: MealAssignment[];
    activeMealPlan: ActiveMealPlanSummary | null;
  };

  const { data, error, isLoading, mutate, isValidating } = useSWR<UseClientMealsData, ApiError>(
    key,
    async (url: string) => {
      const response = await fetch(url);

      if (!response.ok) {
        console.warn('Failed to fetch meal plans');
        return { assignments: [], activeMealPlan: null };
      }

      const mealPlans = await response.json();

      if (!Array.isArray(mealPlans)) {
        console.warn('Meal plans response is not an array');
        return { assignments: [], activeMealPlan: null };
      }

      // Transform meal plans into flat list of meal assignments
      const allAssignments: MealAssignment[] = [];

      mealPlans.forEach(
        (plan: {
          id: string;
          clientId: string;
          name: string;
          startDate: string;
          updatedAt: string;
          isActive?: boolean;
          endDate?: string;
          mealAssignments?: {
            id: string;
            mealId: string;
            notes?: string;
            dayOfWeek?: number;
            mealType?: string;
            portion?: number;
            meal: MealAssignment['meal'];
            side?: MealAssignment['side'];
          }[];
        }) => {
          if (!plan.mealAssignments || !Array.isArray(plan.mealAssignments)) {
            return;
          }

          plan.mealAssignments.forEach(
            (assignment: {
              id: string;
              mealId: string;
              notes?: string;
              dayOfWeek?: number;
              mealType?: string;
              portion?: number;
              meal: MealAssignment['meal'];
              side?: MealAssignment['side'];
            }) => {
              allAssignments.push({
                id: assignment.id,
                mealId: assignment.mealId,
                mealPlanId: plan.id,
                clientId: clientId!,
                assignedDate: new Date(plan.startDate),
                dueDate: plan.endDate ? new Date(plan.endDate) : undefined,
                status: 'assigned',
                notes: assignment.notes,
                dayOfWeek: assignment.dayOfWeek,
                mealType: assignment.mealType,
                portion: assignment.portion,
                meal: assignment.meal,
                side: assignment.side,
              });
            },
          );
        },
      );

      const activePlanCandidate = mealPlans.find((plan: { isActive?: boolean }) => plan.isActive) ?? mealPlans[0];

      const activeMealPlan: ActiveMealPlanSummary | null = activePlanCandidate
        ? {
            id: activePlanCandidate.id,
            clientId: activePlanCandidate.clientId,
            name: activePlanCandidate.name,
            updatedAt: activePlanCandidate.updatedAt,
          }
        : null;

      return {
        assignments: allAssignments,
        activeMealPlan,
      };
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    meals: data?.assignments || [],
    activeMealPlan: data?.activeMealPlan ?? null,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
    mutate,
  };
}
