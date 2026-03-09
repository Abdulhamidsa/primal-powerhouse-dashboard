import { httpClient } from '@/lib/http/client';
import type {
  MealPlanRecalculationPayload,
  MealPlanRecalculationResponse,
} from '@/features/meal-plan-recalculation/types/mealPlanRecalculation.types';

export function buildMealPlanRecalculationUrl(mealPlanId: string): string {
  return `/api/meal-plans/${mealPlanId}/recalculate-calories`;
}

export async function recalculateMealPlan(
  mealPlanId: string,
  payload: MealPlanRecalculationPayload
): Promise<MealPlanRecalculationResponse> {
  return httpClient.post<MealPlanRecalculationResponse>(buildMealPlanRecalculationUrl(mealPlanId), payload);
}
