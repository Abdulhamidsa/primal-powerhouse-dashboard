import { useMemo, useState } from 'react';
import type { MealOptionGroups, MealTypeKey, SlotTargetCalculatorSettings } from '../types/slotTargetCalculator.types';
import {
  calculateSelectionSetSlotPreview,
  createDefaultSlotTargetCalculatorSettings,
} from '../lib/slotTargetCalculator';

export function useSlotTargetCalculator(optionsByType: MealOptionGroups, initialTargetCalories = 2496) {
  const [settings, setSettings] = useState<SlotTargetCalculatorSettings>(() =>
    createDefaultSlotTargetCalculatorSettings(initialTargetCalories),
  );

  const preview = useMemo(() => calculateSelectionSetSlotPreview(optionsByType, settings), [optionsByType, settings]);

  function updateMealDistribution(mealType: MealTypeKey, percentage: number) {
    setSettings(previous => ({
      ...previous,
      mealDistribution: {
        ...previous.mealDistribution,
        [mealType]: { percentage },
      },
    }));
  }

  return {
    settings,
    setSettings,
    updateMealDistribution,
    preview,
    resetSettings: () => setSettings(createDefaultSlotTargetCalculatorSettings(initialTargetCalories)),
  };
}
