import { describe, expect, it } from 'vitest';
import { buildExactRewritePlan } from './exactRecipeRewrite';
import type { ExactRewriteMealAssignment, ExactRewriteMealSnapshot } from './exactRecipeRewrite';
import type { SlotTargetCalculatorSettings, MealTypeKey } from '../types/slotTargetCalculator.types';

function buildMeal(
  id: string,
  type: MealTypeKey,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  overrides: Partial<ExactRewriteMealSnapshot> = {},
): ExactRewriteMealSnapshot {
  return {
    id,
    name: `Meal ${id}`,
    type,
    calories,
    protein,
    carbs,
    fat,
    fiber: 0,
    ingredients: JSON.stringify([{ name: 'Chicken breast', grams: 100, amount: 100, unit: 'g' }]),
    spices: JSON.stringify(['salt']),
    instructions: JSON.stringify(['Cook it']),
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    tags: JSON.stringify(['test']),
    imageUrl: null,
    isPersonalized: false,
    originalMealId: null,
    clientId: null,
    coachId: 'coach-1',
    ...overrides,
  };
}

function buildAssignment(
  id: string,
  dayOfWeek: number,
  mealType: MealTypeKey,
  meal: ExactRewriteMealSnapshot,
): ExactRewriteMealAssignment {
  return {
    id,
    dayOfWeek,
    mealType,
    mealId: meal.id,
    meal,
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

describe('exactRecipeRewrite', () => {
  it('builds exact slot targets per meal type', () => {
    const plan = buildExactRewritePlan({
      clientId: 'client-1',
      settings: buildSettings(),
      mealAssignments: [
        buildAssignment('b1', 0, 'BREAKFAST', buildMeal('breakfast-a', 'BREAKFAST', 500, 40, 50, 12)),
        buildAssignment('l1', 0, 'LUNCH', buildMeal('lunch-a', 'LUNCH', 600, 35, 60, 20)),
      ],
    });

    expect(plan.slotTargets.BREAKFAST.calories).toBe(624);
    expect(plan.slotTargets.LUNCH.calories).toBe(874);
    expect(plan.mealTypeSummaries.find(summary => summary.mealType === 'BREAKFAST')?.assignmentsAffected).toBe(1);
    expect(plan.mealTypeSummaries.find(summary => summary.mealType === 'LUNCH')?.targetProtein).toBe(65.5);
  });

  it('keeps repeated assignments together while preserving their independent updates', () => {
    const meal = buildMeal('breakfast-a', 'BREAKFAST', 500, 40, 50, 12);

    const plan = buildExactRewritePlan({
      clientId: 'client-1',
      settings: buildSettings(),
      mealAssignments: [
        buildAssignment('b1', 0, 'BREAKFAST', meal),
        buildAssignment('b2', 1, 'BREAKFAST', meal),
        buildAssignment('b3', 2, 'BREAKFAST', meal),
      ],
    });

    expect(plan.mealsToCreate).toBe(1);
    expect(plan.assignmentsToRepoint).toBe(3);
    expect(plan.mealTypeSummaries.find(summary => summary.mealType === 'BREAKFAST')?.uniqueMealCount).toBe(1);
    expect(plan.mealTypeSummaries.find(summary => summary.mealType === 'BREAKFAST')?.assignmentsToCreate).toBe(3);
  });

  it('updates client-owned personalized meals in place when possible', () => {
    const personalizedMeal = buildMeal('lunch-a', 'LUNCH', 620, 45, 58, 18, {
      isPersonalized: true,
      clientId: 'client-1',
      originalMealId: 'base-lunch-a',
    });

    const plan = buildExactRewritePlan({
      clientId: 'client-1',
      settings: buildSettings(),
      mealAssignments: [buildAssignment('l1', 0, 'LUNCH', personalizedMeal)],
    });

    expect(plan.mealsToCreate).toBe(0);
    expect(plan.mealsToUpdate).toBe(1);
    expect(plan.assignmentsToRepoint).toBe(0);
  });

  it('blocks rewrites that fall outside safe portion bounds', () => {
    const tinyBreakfast = buildMeal('tiny-breakfast', 'BREAKFAST', 100, 10, 10, 3);

    const plan = buildExactRewritePlan({
      clientId: 'client-1',
      settings: buildSettings(),
      mealAssignments: [buildAssignment('b1', 0, 'BREAKFAST', tinyBreakfast)],
    });

    expect(plan.canApply).toBe(false);
    expect(plan.warnings.join(' ')).toContain('cannot be rewritten exactly within safe portion bounds');
  });
});
