'use client';

import { useState } from 'react';
import type { GeneratedMeal } from '@/types/meal';
import { saveGeneratedMealTemplateApi } from '@/features/meals/api/mealTemplate.api';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type SaveMap = Record<string, SaveStatus>;
type ErrorMap = Record<string, string>;

function getMealKey(meal: GeneratedMeal, index: number): string {
  return `${meal.name}::${meal.type}::${index}`;
}

export function useSaveGeneratedMealTemplate() {
  const [statusByMeal, setStatusByMeal] = useState<SaveMap>({});
  const [errorByMeal, setErrorByMeal] = useState<ErrorMap>({});

  const saveMeal = async (meal: GeneratedMeal, index: number, force = false) => {
    const key = getMealKey(meal, index);
    setStatusByMeal(prev => ({ ...prev, [key]: 'saving' }));
    setErrorByMeal(prev => ({ ...prev, [key]: '' }));

    try {
      await saveGeneratedMealTemplateApi({
        meal,
        force,
        tags: ['ai-generated'],
      });

      setStatusByMeal(prev => ({ ...prev, [key]: 'saved' }));
      return { success: true as const, duplicate: false };
    } catch (err: any) {
      const message = String(err?.message ?? 'Failed to save template');
      const isDuplicate = err?.status === 409 && message.includes('DUPLICATE_TEMPLATE');
      setStatusByMeal(prev => ({ ...prev, [key]: 'error' }));
      setErrorByMeal(prev => ({ ...prev, [key]: message }));
      return { success: false as const, duplicate: isDuplicate, message };
    }
  };

  const getMealStatus = (meal: GeneratedMeal, index: number): SaveStatus => {
    const key = getMealKey(meal, index);
    return statusByMeal[key] ?? 'idle';
  };

  const getMealError = (meal: GeneratedMeal, index: number): string => {
    const key = getMealKey(meal, index);
    return errorByMeal[key] ?? '';
  };

  return {
    saveMeal,
    getMealStatus,
    getMealError,
  } as const;
}

export default useSaveGeneratedMealTemplate;
