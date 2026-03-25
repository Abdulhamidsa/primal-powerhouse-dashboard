'use client';

import { useState } from 'react';
import type { GenerateMealsInput, GeneratedMeal } from '@/types/meal';
import { generateMealsApi } from '@/features/meals/api/mealGenerator.api';

export function useMealGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedMeal[] | null>(null);

  const generate = async (input: GenerateMealsInput) => {
    setLoading(true);
    setError(null);
    try {
      const capped = { ...input, mealCount: Math.min(input.mealCount ?? 5, 10) };
      const meals = await generateMealsApi(capped);
      setResults(meals);
      return meals;
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResults(null);
    setError(null);
    setLoading(false);
  };

  return { generate, loading, error, results, reset } as const;
}

export default useMealGenerator;
