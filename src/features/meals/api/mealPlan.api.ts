import { httpClient } from '@/lib/http/client';
import type { MealPlanSummaryResponse } from '@/features/meals/types/mealPlanSummary.types';

export const USER_MEAL_PLAN_SUMMARY_URL = '/api/user/meals/summary';

export async function getUserMealPlanSummary(): Promise<MealPlanSummaryResponse> {
  return httpClient.get<MealPlanSummaryResponse>(USER_MEAL_PLAN_SUMMARY_URL);
}

