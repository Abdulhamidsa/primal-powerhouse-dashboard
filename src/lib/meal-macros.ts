import type { MacroTotals, MatchedIngredient } from '@/types/meal';

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateMealMacros(ingredients: MatchedIngredient[]): MacroTotals {
  const totals: MacroTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };

  for (const ingredient of ingredients) {
    const factor = ingredient.grams / 100;

    totals.calories += ingredient.caloriesKcal * factor;
    totals.protein += ingredient.proteinG * factor;
    totals.carbs += ingredient.carbsG * factor;
    totals.fat += ingredient.fatG * factor;
    totals.fiber += (ingredient.fiberG ?? 0) * factor;
  }

  return {
    calories: round1(totals.calories),
    protein: round1(totals.protein),
    carbs: round1(totals.carbs),
    fat: round1(totals.fat),
    fiber: round1(totals.fiber),
  };
}

export function isMealValid(macros: MacroTotals, targetCalories: number, targetProtein: number): boolean {
  const minCalories = targetCalories * 0.85;
  const maxCalories = targetCalories * 1.15;
  const minProtein = targetProtein * 0.9;

  return macros.calories >= minCalories && macros.calories <= maxCalories && macros.protein >= minProtein;
}
