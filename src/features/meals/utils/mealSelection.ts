export const MEAL_SLOT_LIMITS = {
  BREAKFAST: 1,
  LUNCH: 1,
  DINNER: 1,
  SNACK: 2,
} as const;

export type MealTypeKey = keyof typeof MEAL_SLOT_LIMITS;

export type MealSelectionMacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealOption = {
  sourceAssignmentId: string;
  mealType: MealTypeKey;
  portion: number;
  scheduledTime: string | null;
  meal: {
    id: string;
    name: string;
    type: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    imageUrl?: string | null;
    prepTime?: number | null;
    cookTime?: number | null;
    servings?: number | null;
  };
};

export type UserSelectionItem = {
  mealType: MealTypeKey;
  slotIndex: number;
  mealId: string;
  sourceAssignmentId?: string | null;
  portion: number;
  meal: MealOption['meal'];
};

export function emptyMacroTotals(): MealSelectionMacroTotals {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function addMacros(
  totals: MealSelectionMacroTotals,
  meal: Pick<MealOption['meal'], 'calories' | 'protein' | 'carbs' | 'fat'>,
  portion: number
): MealSelectionMacroTotals {
  return {
    calories: totals.calories + meal.calories * portion,
    protein: totals.protein + meal.protein * portion,
    carbs: totals.carbs + meal.carbs * portion,
    fat: totals.fat + meal.fat * portion,
  };
}

export function roundMacroTotals(totals: MealSelectionMacroTotals): MealSelectionMacroTotals {
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
  };
}

export function buildBaselineSelection(optionsByType: Record<MealTypeKey, MealOption[]>): UserSelectionItem[] {
  const baseline: UserSelectionItem[] = [];

  (['BREAKFAST', 'LUNCH', 'DINNER'] as const).forEach(type => {
    const option = optionsByType[type][0];
    if (!option) return;

    baseline.push({
      mealType: type,
      slotIndex: 0,
      mealId: option.meal.id,
      sourceAssignmentId: option.sourceAssignmentId,
      portion: option.portion,
      meal: option.meal,
    });
  });

  optionsByType.SNACK.slice(0, MEAL_SLOT_LIMITS.SNACK).forEach((option, index) => {
    baseline.push({
      mealType: 'SNACK',
      slotIndex: index,
      mealId: option.meal.id,
      sourceAssignmentId: option.sourceAssignmentId,
      portion: option.portion,
      meal: option.meal,
    });
  });

  return baseline;
}

export function computeSelectionTotals(items: Array<Pick<UserSelectionItem, 'portion' | 'meal'>>): MealSelectionMacroTotals {
  const totals = items.reduce((acc, item) => addMacros(acc, item.meal, item.portion), emptyMacroTotals());
  return roundMacroTotals(totals);
}

export function macroDelta(
  selected: MealSelectionMacroTotals,
  baseline: MealSelectionMacroTotals
): MealSelectionMacroTotals {
  return {
    calories: selected.calories - baseline.calories,
    protein: selected.protein - baseline.protein,
    carbs: selected.carbs - baseline.carbs,
    fat: selected.fat - baseline.fat,
  };
}

export function normalizeMealType(value: string): MealTypeKey | null {
  const upper = value.toUpperCase();
  if (upper === 'BREAKFAST' || upper === 'LUNCH' || upper === 'DINNER' || upper === 'SNACK') {
    return upper;
  }
  return null;
}

export function isMealTypeKey(value: string): value is MealTypeKey {
  return normalizeMealType(value) !== null;
}
