import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SlotTargetCalculatorPanel } from './SlotTargetCalculatorPanel';
import { calculateSelectionSetSlotPreview, createDefaultSlotTargetCalculatorSettings } from '../lib/slotTargetCalculator';
import type { MealOptionGroups } from '../types/slotTargetCalculator.types';
import type { MealOption } from '../../meals/types/mealSelection.types';

function buildMealOption(overrides: Partial<MealOption> = {}): MealOption {
  return {
    sourceAssignmentId: 'assignment-1',
    mealType: 'BREAKFAST',
    portion: 1,
    scheduledTime: null,
    side: null,
    meal: {
      id: 'meal-1',
      name: 'Protein Oats',
      type: 'BREAKFAST',
      calories: 500,
      protein: 40,
      carbs: 50,
      fat: 12,
    },
    ...overrides,
  };
}

describe('SlotTargetCalculatorPanel', () => {
  it('renders grouped meal options and slot targets', () => {
    const optionsByType: MealOptionGroups = {
      BREAKFAST: [buildMealOption(), buildMealOption({ sourceAssignmentId: 'assignment-2', meal: { ...buildMealOption().meal, id: 'meal-2', name: 'Egg Wrap', calories: 300, protein: 30, carbs: 20, fat: 10 } })],
      LUNCH: [],
      DINNER: [],
      SNACK: [],
    };
    const settings = createDefaultSlotTargetCalculatorSettings(2496);
    const preview = calculateSelectionSetSlotPreview(optionsByType, settings);

    const markup = renderToStaticMarkup(
      <SlotTargetCalculatorPanel
        settings={settings}
        preview={preview}
        onTargetCaloriesChange={() => {}}
        onMacroModeChange={() => {}}
        onMacroFieldChange={() => {}}
        onScalingModeChange={() => {}}
        onDistributionChange={() => {}}
        onReset={() => {}}
      />,
    );

    expect(markup).toContain('Target Settings');
    expect(markup).toContain('Breakfast');
    expect(markup).toContain('624 kcal');
    expect(markup).toContain('Protein Oats');
    expect(markup).toContain('Egg Wrap');
    expect(markup).not.toContain('Replacement Opportunities');
    expect(markup).not.toContain('Meal Portion Deltas');
    expect(markup).not.toContain('Preview Blocked');
  });
});
