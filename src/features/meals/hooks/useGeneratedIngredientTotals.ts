import { useMemo } from 'react';
import type { GeneratedMeal } from '@/types/meal';
import type { GeneratedIngredientTotal } from '@/features/meals/types/generatedIngredientTotals.types';

export function useGeneratedIngredientTotals(meals: GeneratedMeal[] | null): GeneratedIngredientTotal[] {
  return useMemo(() => {
    if (!meals || meals.length === 0) {
      return [];
    }

    const totalsByKey = new Map<string, GeneratedIngredientTotal>();

    for (const meal of meals) {
      for (const ingredient of meal.ingredients) {
        const key = ingredient.id || ingredient.name.toLowerCase();
        const label = ingredient.displayName ?? ingredient.name;

        const existing = totalsByKey.get(key);

        if (!existing) {
          totalsByKey.set(key, {
            key,
            label,
            totalGrams: ingredient.grams,
            contributors: [{ mealName: meal.name, grams: ingredient.grams }],
          });
          continue;
        }

        existing.totalGrams += ingredient.grams;
        existing.contributors.push({ mealName: meal.name, grams: ingredient.grams });
      }
    }

    return [...totalsByKey.values()].sort((a, b) => b.totalGrams - a.totalGrams);
  }, [meals]);
}

export default useGeneratedIngredientTotals;
