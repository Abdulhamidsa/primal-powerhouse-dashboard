'use client';

import { useCallback, useState } from 'react';
import type { MealOption, MealTypeKey, SelectionItem } from '@/features/meals/types/mealSelection.types';
import { buildRandomizedMealPlan } from '@/features/meal-plan-randomizer/api/mealPlanRandomizer.api';

type UseMealPlanRandomizerInput = {
  optionsByType: Record<MealTypeKey, MealOption[]> | undefined;
  snackMax: number;
  selectedCount: number;
  saveDraft: (items?: SelectionItem[] | null) => Promise<boolean>;
};

export function useMealPlanRandomizer({ optionsByType, snackMax, selectedCount, saveDraft }: UseMealPlanRandomizerInput) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasExistingSelection = selectedCount > 0;

  const randomize = useCallback(async () => {
    const nextPlan = buildRandomizedMealPlan(optionsByType, snackMax);

    if (nextPlan.missingRequiredMealTypes.length > 0) {
      setErrorMessage('Not enough meals are available to randomize the full plan.');
      return false;
    }

    try {
      setIsRandomizing(true);
      setErrorMessage(null);

      const ok = await saveDraft(nextPlan.items);
      if (ok) {
        setConfirmOpen(false);
      }

      return ok;
    } catch {
      setErrorMessage('Could not randomize your plan. Please try again.');
      return false;
    } finally {
      setIsRandomizing(false);
    }
  }, [optionsByType, saveDraft, snackMax]);

  const requestRandomize = useCallback(() => {
    if (hasExistingSelection) {
      setConfirmOpen(true);
      return;
    }

    void randomize();
  }, [hasExistingSelection, randomize]);

  return {
    confirmOpen,
    setConfirmOpen,
    requestRandomize,
    randomize,
    isRandomizing,
    errorMessage,
    hasExistingSelection,
  };
}
