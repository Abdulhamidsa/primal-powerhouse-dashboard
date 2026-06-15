import type { MealOption, MealTypeKey, SelectionItem } from '@/features/meals/types/mealSelection.types';
import type { RandomizedMealPlanResult } from '@/features/meal-plan-randomizer/types/mealPlanRandomizer.types';

const REQUIRED_MEAL_TYPES: Exclude<MealTypeKey, 'SNACK'>[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function buildSelectionItem(option: MealOption, mealType: MealTypeKey, slotIndex: number): SelectionItem {
  return {
    mealType,
    slotIndex,
    mealId: option.meal.id,
    sourceAssignmentId: option.sourceAssignmentId,
    portion: option.portion,
    side: option.side ?? null,
    meal: option.meal,
  };
}

export function buildRandomizedMealPlan(
  optionsByType: Record<MealTypeKey, MealOption[]> | undefined,
  snackMax: number,
): RandomizedMealPlanResult {
  const items: SelectionItem[] = [];
  const missingRequiredMealTypes: Exclude<MealTypeKey, 'SNACK'>[] = [];

  for (const mealType of REQUIRED_MEAL_TYPES) {
    const option = pickRandom(optionsByType?.[mealType] ?? []);

    if (!option) {
      missingRequiredMealTypes.push(mealType);
      continue;
    }

    items.push(buildSelectionItem(option, mealType, 0));
  }

  const snackOptions = shuffle(optionsByType?.SNACK ?? []);
  const snackSelections = snackOptions.slice(0, Math.min(snackMax, snackOptions.length));

  snackSelections.forEach((option, index) => {
    items.push(buildSelectionItem(option, 'SNACK', index));
  });

  return {
    items,
    missingRequiredMealTypes,
  };
}
