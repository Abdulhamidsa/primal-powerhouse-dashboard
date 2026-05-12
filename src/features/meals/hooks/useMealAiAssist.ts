'use client';

import { useState } from 'react';
import { httpClient } from '@/lib/http/client';

interface MatchedIngredient {
  id: string;
  name: string;
  grams: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  displayUnitLabel: string | null;
  gramsPerUnit: number | null;
}

interface UnmatchedIngredient {
  name: string;
  grams: number;
}

export interface SuggestIngredientsResult {
  success: boolean;
  ingredients: MatchedIngredient[];
  unmatched: UnmatchedIngredient[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  mealName?: string;
  message?: string;
}

export function useMealAiAssist() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestIngredientsResult | null>(null);

  async function suggestIngredientsFromMealDescription(
    mealDescription: string,
    mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
  ): Promise<SuggestIngredientsResult | null> {
    setLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const result = await httpClient.post<SuggestIngredientsResult>('/api/mealsAI/suggest-ingredients', {
        mealDescription,
        mealType,
      });

      if (result.success) {
        setSuggestions(result);
        return result;
      } else {
        const errorMsg = result.message || 'Failed to suggest ingredients';
        setError(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      console.error('Meal AI assist error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }

  function resetSuggestions() {
    setSuggestions(null);
    setError(null);
  }

  return {
    loading,
    error,
    suggestions,
    suggestIngredientsFromMealDescription,
    resetSuggestions,
  };
}
