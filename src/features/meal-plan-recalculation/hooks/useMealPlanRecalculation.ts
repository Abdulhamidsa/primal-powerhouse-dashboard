'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { recalculateMealPlan } from '@/features/meal-plan-recalculation/api/mealPlanRecalculation.api';
import type {
  MealPlanRecalculationPayload,
  MealPlanRecalculationResult,
} from '@/features/meal-plan-recalculation/types/mealPlanRecalculation.types';

export function useMealPlanRecalculation(clientId: string | null) {
  const { mutate } = useSWRConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (mealPlanId: string, payload: MealPlanRecalculationPayload): Promise<MealPlanRecalculationResult> => {
    setIsSubmitting(true);
    try {
      const response = await recalculateMealPlan(mealPlanId, payload);

      if (payload.mode === 'apply' && clientId) {
        await mutate(`/api/meal-plans?clientId=${clientId}`);
        await mutate(`/api/meal-plans/${mealPlanId}`);
      }

      return response.result;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submit,
    isSubmitting,
  };
}
