import { describe, expect, it } from 'vitest';
import { previewApplySelectionSetStructureToMealPlan } from './selectionSetStructure';
import type { SlotTargetCalculatorSettings, SlotTargetStructureSelectionItem, MealTypeKey } from '../types/slotTargetCalculator.types';

function buildMeal(id: string, mealType: MealTypeKey, calories: number, protein: number, carbs: number, fat: number) {
  return {
    id,
    name: `Meal ${id}`,
    type: mealType,
    description: null,
    calories,
    protein,
    carbs,
    fat,
    ingredients: null,
    spices: null,
    instructions: null,
    category: null,
    difficulty: null,
    imageUrl: null,
    prepTime: null,
    cookTime: null,
    servings: null,
    tags: null,
  };
}

function buildSelectionItem(
  id: string,
  mealType: SlotTargetStructureSelectionItem['mealType'],
  slotIndex: number,
  calories: number,
): SlotTargetStructureSelectionItem {
  return {
    id,
    mealType,
    slotIndex,
    mealId: id,
    portion: 1,
    sourceAssignmentId: id,
    meal: buildMeal(id, mealType, calories, calories / 10, calories / 12, calories / 20),
    side: null,
  };
}

function buildSettings(): SlotTargetCalculatorSettings {
  return {
    targetCalories: 2496,
    macroMode: 'percentage',
    proteinPercentage: 30,
    carbPercentage: 40,
    fatPercentage: 30,
    proteinGrams: 187.2,
    carbGrams: 249.6,
    fatGrams: 83.2,
    scalingMode: 'SCALE_TO_SLOT_TARGET',
    mealDistribution: {
      BREAKFAST: { percentage: 25 },
      LUNCH: { percentage: 35 },
      DINNER: { percentage: 30 },
      SNACK: { percentage: 10 },
    },
  };
}

function buildAssignment(dayOfWeek: number, mealType: MealTypeKey, mealId: string) {
  return {
    id: `${mealType}-${dayOfWeek}`,
    mealId,
    clientId: 'client-1',
    assignedDate: new Date(),
    status: 'assigned',
    dayOfWeek,
    mealType,
    portion: 1,
    meal: {
      id: mealId,
      name: `Meal ${mealId}`,
      type: mealType,
      calories: 500,
      protein: 40,
      carbs: 50,
      fat: 12,
    },
    side: null,
  };
}

describe('selectionSetStructure', () => {
  it('rotates breakfast options across seven days in week-structure mode', () => {
    const selectionItems = [
      buildSelectionItem('breakfast-a', 'BREAKFAST', 0, 500),
      buildSelectionItem('breakfast-b', 'BREAKFAST', 1, 400),
      buildSelectionItem('breakfast-c', 'BREAKFAST', 2, 300),
    ];

    const result = previewApplySelectionSetStructureToMealPlan({
      selectionItems,
      currentAssignments: [],
      settings: buildSettings(),
      applyMode: 'APPLY_STRUCTURE_TO_WEEK',
    });

    const breakfastOps = result.operations.filter(operation => operation.mealType === 'BREAKFAST');

    expect(breakfastOps).toHaveLength(7);
    expect(breakfastOps.map(operation => operation.mealId)).toEqual([
      'breakfast-a',
      'breakfast-b',
      'breakfast-c',
      'breakfast-a',
      'breakfast-b',
      'breakfast-c',
      'breakfast-a',
    ]);
  });

  it('keeps update-only mode from replacing meals', () => {
    const selectionItems = [buildSelectionItem('lunch-a', 'LUNCH', 0, 500)];
    const currentAssignments = [buildAssignment(1, 'LUNCH', 'lunch-a')];

    const result = previewApplySelectionSetStructureToMealPlan({
      selectionItems,
      currentAssignments,
      settings: buildSettings(),
      applyMode: 'UPDATE_PORTIONS_ONLY',
    });

    expect(result.assignmentsToReplace).toBe(0);
    expect(result.assignmentsToUpdate).toBeGreaterThan(0);
    expect(result.operations.every(operation => operation.operation !== 'replace')).toBe(true);
  });

  it('updates every existing assignment in update-only mode even when meals repeat', () => {
    const selectionItems = [
      buildSelectionItem('breakfast-a', 'BREAKFAST', 0, 500),
      buildSelectionItem('breakfast-b', 'BREAKFAST', 1, 520),
      buildSelectionItem('breakfast-c', 'BREAKFAST', 2, 540),
    ];
    const currentAssignments = [
      buildAssignment(0, 'BREAKFAST', 'breakfast-a'),
      buildAssignment(1, 'BREAKFAST', 'breakfast-a'),
      buildAssignment(2, 'BREAKFAST', 'breakfast-a'),
    ];

    const result = previewApplySelectionSetStructureToMealPlan({
      selectionItems,
      currentAssignments,
      settings: buildSettings(),
      applyMode: 'UPDATE_PORTIONS_ONLY',
    });

    expect(result.assignmentsToUpdate).toBe(3);
    expect(result.operations).toHaveLength(3);
    expect(result.operations.every(operation => operation.operation === 'update')).toBe(true);
  });

  it('updates existing assignments and creates missing ones in week-structure mode', () => {
    const selectionItems = [buildSelectionItem('dinner-a', 'DINNER', 0, 600)];
    const currentAssignments = [buildAssignment(0, 'DINNER', 'dinner-a')];

    const result = previewApplySelectionSetStructureToMealPlan({
      selectionItems,
      currentAssignments,
      settings: buildSettings(),
      applyMode: 'APPLY_STRUCTURE_TO_WEEK',
    });

    expect(result.assignmentsToUpdate).toBe(1);
    expect(result.assignmentsToCreate).toBe(6);
    expect(result.operations.find(operation => operation.dayOfWeek === 0)?.operation).toBe('update');
    expect(result.operations.filter(operation => operation.operation === 'create')).toHaveLength(6);
  });

  it('applies calculated portion multipliers from the slot calculator', () => {
    const selectionItems = [buildSelectionItem('breakfast-a', 'BREAKFAST', 0, 500)];

    const result = previewApplySelectionSetStructureToMealPlan({
      selectionItems,
      currentAssignments: [],
      settings: buildSettings(),
      applyMode: 'APPLY_STRUCTURE_TO_WEEK',
    });

    expect(result.operations[0].portion).toBe(1.2);
  });

  it('warns when a meal type has no selected options', () => {
    const currentAssignments = [buildAssignment(0, 'BREAKFAST', 'breakfast-a')];

    const result = previewApplySelectionSetStructureToMealPlan({
      selectionItems: [],
      currentAssignments,
      settings: buildSettings(),
      applyMode: 'APPLY_STRUCTURE_TO_WEEK',
    });

    expect(result.warnings).toContain('No options selected for BREAKFAST, existing assignments were not changed.');
    expect(result.assignmentsToCreate).toBe(0);
    expect(result.assignmentsToUpdate).toBe(0);
    expect(result.assignmentsToReplace).toBe(0);
  });
});
