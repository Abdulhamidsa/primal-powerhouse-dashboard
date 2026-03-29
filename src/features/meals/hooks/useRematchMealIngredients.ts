'use client';

import { useState } from 'react';
import { rematchMealIngredientsApi } from '@/features/meals/api/mealTemplateGeneration.api';
import type { RematchMealIngredientsResponse } from '@/features/meals/types/mealTemplateGeneration.types';
import type { UnmatchedIngredientInput } from '@/types/meal';

export function useRematchMealIngredients() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rematch = async (unmatchedIngredients: UnmatchedIngredientInput[]): Promise<RematchMealIngredientsResponse> => {
    setLoading(true);
    setError(null);

    try {
      return await rematchMealIngredientsApi(unmatchedIngredients);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rematch ingredients';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    rematch,
  } as const;
}
