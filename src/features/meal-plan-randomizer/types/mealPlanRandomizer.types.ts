import type { MealTypeKey, SelectionItem } from '@/features/meals/types/mealSelection.types';

export type RandomizedMealPlanResult = {
  items: SelectionItem[];
  missingRequiredMealTypes: Exclude<MealTypeKey, 'SNACK'>[];
};
