import { httpClient } from '@/lib/http/client';
import type { MealDetail } from '@/features/meals/types/mealDetail.types';

export const USER_MEAL_DETAIL_URL = '/api/meals';

export function getUserMealDetail(mealId: string) {
  return httpClient.get<MealDetail>(`${USER_MEAL_DETAIL_URL}/${mealId}?view=client`);
}