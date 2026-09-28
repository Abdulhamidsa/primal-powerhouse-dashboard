import { describe, expect, it } from 'vitest';
import {
  buildMealSelectionInsight,
  toggleMealSelectionItem,
} from './mealSelectionPlanner';
import type { MealOption, SelectionItem } from '@/features/meals/types/mealSelection.types';

function buildMealOption(overrides: Partial<MealOption> = {}): MealOption {
  return {
    sourceAssignmentId: 'assignment-1',
    mealType: 'SNACK',
    portion: 1,
    scheduledTime: null,
    side: null,
    meal: {
      id: 'meal-1',
      name: 'Greek Yogurt Bowl',
      type: 'SNACK',
      calories: 220,
      protein: 20,
      carbs: 18,
      fat: 8,
      ingredients: 'Greek yogurt, berries',
    },
    ...overrides,
  };
}

function buildSelectionItem(overrides: Partial<SelectionItem> = {}): SelectionItem {
  return {
    mealType: 'SNACK',
    slotIndex: 0,
    mealId: 'meal-1',
    sourceAssignmentId: 'assignment-1',
    portion: 1,
    side: null,
    meal: buildMealOption().meal,
    ...overrides,
  };
}

describe('mealSelectionPlanner', () => {
  it('adds, removes, and limits snack selections', () => {
    const firstSnack = buildMealOption();
    const secondSnack = buildMealOption({
      sourceAssignmentId: 'assignment-2',
      meal: { ...buildMealOption().meal, id: 'meal-2', name: 'Protein Pudding' },
    });
    const thirdSnack = buildMealOption({
      sourceAssignmentId: 'assignment-3',
      meal: { ...buildMealOption().meal, id: 'meal-3', name: 'Protein Bar' },
    });

    const afterFirst = toggleMealSelectionItem([], firstSnack, 2);
    expect(afterFirst).toHaveLength(1);
    expect(afterFirst[0].slotIndex).toBe(0);

    const afterSecond = toggleMealSelectionItem(afterFirst, secondSnack, 2);
    expect(afterSecond).toHaveLength(2);

    const blocked = toggleMealSelectionItem(afterSecond, thirdSnack, 2);
    expect(blocked).toHaveLength(2);

    const removed = toggleMealSelectionItem(afterSecond, firstSnack, 2);
    expect(removed).toHaveLength(1);
    expect(removed[0].mealId).toBe('meal-2');
    expect(removed[0].slotIndex).toBe(0);
  });

  it('builds a helpful macro insight', () => {
    const insight = buildMealSelectionInsight({
      selectedTotals: { calories: 2100, protein: 140, carbs: 190, fat: 70 },
      targetTotals: { calories: 2000, protein: 150, carbs: 180, fat: 65 },
      snackCount: 1,
      snackMax: 2,
      hasRequiredSlots: false,
      hasChanges: true,
    });

    expect(insight.tone).toBe('warn');
    expect(insight.title).toContain('Finish');
    expect(insight.helper).toContain('1/2');
  });

  it('recognizes a locked-in selection', () => {
    const source = [buildSelectionItem()];

    const insight = buildMealSelectionInsight({
      selectedTotals: { calories: 220, protein: 20, carbs: 18, fat: 8 },
      targetTotals: { calories: 220, protein: 20, carbs: 18, fat: 8 },
      snackCount: 1,
      snackMax: 2,
      hasRequiredSlots: true,
      hasChanges: false,
    });

    expect(insight.tone).toBe('good');
    expect(insight.title).toBe('Ready to roll');
    expect(source[0].meal.name).toBe('Greek Yogurt Bowl');
  });
});
