'use client';

import { useCallback, useState } from 'react';
import { generateMealTemplateApi } from '@/features/meals/api/mealTemplateGeneration.api';
import type {
  BuilderMealType,
  FoodOrigin,
  GenerateMealTemplateOptions,
  GeneratedMealTemplate,
} from '@/features/meals/types/mealTemplateGeneration.types';

export function useGenerateMealTemplate() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GeneratedMealTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [recentCoreDishReferences, setRecentCoreDishReferences] = useState<string[]>([]);
  const [recentMealNames, setRecentMealNames] = useState<string[]>([]);

  const generateTemplate = async (
    mealType: BuilderMealType,
    foodOrigin?: FoodOrigin,
    preferredProtein?: string,
  ): Promise<GeneratedMealTemplate> => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateMealTemplateApi(mealType, {
        strictMatchMode: 'strict',
        foodOrigin,
        preferredProtein,
        avoidCoreDishReferences: recentCoreDishReferences.slice(0, 3),
        avoidMealNames: recentMealNames.slice(0, 6),
      } satisfies GenerateMealTemplateOptions);
      setData(result);
      setRegenerationCount(prev => prev + 1);
      setRecentCoreDishReferences(prev => {
        const next = [result.coreDishReference, ...prev.filter(item => item !== result.coreDishReference)];
        return next.slice(0, 8);
      });
      setRecentMealNames(prev => {
        const next = [result.mealName, ...prev.filter(item => item !== result.mealName)];
        return next.slice(0, 12);
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate meal template';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = useCallback(() => {
    setLoading(false);
    setData(null);
    setError(null);
    setRegenerationCount(0);
    setRecentCoreDishReferences([]);
    setRecentMealNames([]);
  }, []);

  return {
    loading,
    data,
    error,
    regenerationCount,
    recentCoreDishReferences,
    recentMealNames,
    generateTemplate,
    reset,
  } as const;
}

export default useGenerateMealTemplate;
