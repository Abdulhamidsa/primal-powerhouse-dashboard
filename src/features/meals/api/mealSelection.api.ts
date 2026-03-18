import { httpClient } from '@/lib/http/client';
import type {
  MealOptionsResponse,
  MealSelectionResponse,
  SaveMealSelectionInput,
  SaveMealSelectionResponse,
} from '@/features/meals/types/mealSelection.types';

export const USER_MEAL_OPTIONS_URL = '/api/user/meals/options';
export const USER_MEAL_SELECTION_URL = '/api/user/meals/selection';

export async function getUserMealOptions() {
  return httpClient.get<MealOptionsResponse>(USER_MEAL_OPTIONS_URL);
}

export async function getUserMealSelection() {
  return httpClient.get<MealSelectionResponse>(USER_MEAL_SELECTION_URL);
}

export async function saveUserMealSelection(payload: SaveMealSelectionInput) {
  return httpClient.put<SaveMealSelectionResponse>(USER_MEAL_SELECTION_URL, payload);
}
