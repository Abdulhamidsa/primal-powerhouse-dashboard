import { describe, expect, it } from 'vitest';
import {
  calculateMacroTargets,
  calculateMealOptionAgainstSlot,
  calculateSelectionSetSlotPreview,
  calculateSlotTargets,
  validateMealDistribution,
} from './slotTargetCalculator';
import type { MealOption, MealTypeKey } from '../../meals/types/mealSelection.types';
import type {
  MealOptionGroups,
  MealDistributionState,
  SlotTargetCalculatorSettings,
} from '../types/slotTargetCalculator.types';

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
      description: 'A simple breakfast option',
    },
    ...overrides,
  };
}

function buildSettings(overrides: Partial<SlotTargetCalculatorSettings> = {}): SlotTargetCalculatorSettings {
  const mealDistribution: MealDistributionState = {
    BREAKFAST: { percentage: 25 },
    LUNCH: { percentage: 35 },
    DINNER: { percentage: 30 },
    SNACK: { percentage: 10 },
  };

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
    mealDistribution,
    ...overrides,
  };
}

describe('slotTargetCalculator', () => {
  it('converts percentage macros to grams correctly', () => {
    const result = calculateMacroTargets(buildSettings());

    expect(result.targets.protein).toBe(187.2);
    expect(result.targets.carbs).toBe(249.6);
    expect(result.targets.fat).toBe(83.2);
    expect(result.totalMacroCalories).toBe(2496);
    expect(result.warning).toBeNull();
  });

  it('calculates total macro calories in gram mode', () => {
    const result = calculateMacroTargets(
      buildSettings({
        macroMode: 'grams',
        proteinGrams: 180,
        carbGrams: 240,
        fatGrams: 80,
      }),
    );

    expect(result.totalMacroCalories).toBe(2400);
    expect(result.warning).toBe('Macro total is 96 kcal below target.');
  });

  it('warns when distribution does not total 100%', () => {
    const validation = validateMealDistribution({
      BREAKFAST: { percentage: 20 },
      LUNCH: { percentage: 30 },
      DINNER: { percentage: 30 },
      SNACK: { percentage: 10 },
    });

    expect(validation.isValid).toBe(false);
    expect(validation.issues[0]).toContain('100%');
  });

  it('calculates 25/35/30/10 slot targets for 2496 calories', () => {
    const settings = buildSettings();
    const macroTargets = calculateMacroTargets(settings).targets;
    const slotTargets = calculateSlotTargets(macroTargets, settings.mealDistribution);

    expect(slotTargets.BREAKFAST.calories).toBe(624);
    expect(slotTargets.LUNCH.calories).toBe(874);
    expect(slotTargets.DINNER.calories).toBe(749);
    expect(slotTargets.SNACK.calories).toBe(250);
  });

  it('scales meal options independently instead of summing them', () => {
    const optionsByType: MealOptionGroups = {
      BREAKFAST: [
        buildMealOption({ sourceAssignmentId: 'assignment-1', meal: { ...buildMealOption().meal, id: 'meal-1', calories: 500, protein: 40, carbs: 50, fat: 12 } }),
        buildMealOption({ sourceAssignmentId: 'assignment-2', meal: { ...buildMealOption().meal, id: 'meal-2', name: 'Egg Wrap', calories: 300, protein: 30, carbs: 20, fat: 10 } }),
      ],
      LUNCH: [],
      DINNER: [],
      SNACK: [],
    };

    const preview = calculateSelectionSetSlotPreview(optionsByType, buildSettings());

    expect(preview.groups[0].items).toHaveLength(2);
    expect(preview.groups[0].items[0].mealId).toBe('meal-1');
    expect(preview.groups[0].items[1].mealId).toBe('meal-2');
    expect(preview.groups[0].items[0].calculatedMacros.calories).not.toBe(
      preview.groups[0].items[0].calculatedMacros.calories + preview.groups[0].items[1].calculatedMacros.calories,
    );
  });

  it('scales meal options toward the slot target', () => {
    const option = buildMealOption({ mealType: 'BREAKFAST' });
    const slotTarget = {
      mealType: 'BREAKFAST' as MealTypeKey,
      percentage: 25,
      optionCount: 1,
      calories: 624,
      protein: 187.2 * 0.25,
      carbs: 249.6 * 0.25,
      fat: 83.2 * 0.25,
    };

    const result = calculateMealOptionAgainstSlot(option, slotTarget, 'SCALE_TO_SLOT_TARGET');

    expect(result.portionMultiplier).toBe(1.2);
    expect(result.calculatedMacros.calories).toBe(624);
  });

  it('keeps current portions in keep-portsions mode', () => {
    const option = buildMealOption({
      mealType: 'LUNCH',
      portion: 1.1,
      meal: { ...buildMealOption().meal, id: 'meal-3', calories: 450, protein: 35, carbs: 45, fat: 14 },
    });
    const slotTarget = {
      mealType: 'LUNCH' as MealTypeKey,
      percentage: 35,
      optionCount: 1,
      calories: 874,
      protein: 65.52,
      carbs: 87.36,
      fat: 29.12,
    };

    const result = calculateMealOptionAgainstSlot(option, slotTarget, 'KEEP_PORTIONS');

    expect(result.portionMultiplier).toBe(1.1);
    expect(result.calculatedMacros.calories).toBe(495);
    expect(result.warnings).toContain('Locked portion');
  });

  it('returns a warning when the safe bounds cap the multiplier', () => {
    const option = buildMealOption({
      mealType: 'BREAKFAST',
      meal: { ...buildMealOption().meal, id: 'meal-4', calories: 1200, protein: 80, carbs: 100, fat: 35 },
    });
    const slotTarget = {
      mealType: 'BREAKFAST' as MealTypeKey,
      percentage: 25,
      optionCount: 1,
      calories: 2000,
      protein: 200,
      carbs: 250,
      fat: 80,
    };

    const result = calculateMealOptionAgainstSlot(option, slotTarget, 'SCALE_TO_SLOT_TARGET');

    expect(result.wasClamped).toBe(true);
    expect(result.warnings).toContain('Capped below slot calorie target');
  });

  it('labels above target when the scaled portion hits the minimum bound', () => {
    const option = buildMealOption({
      mealType: 'SNACK',
      meal: { ...buildMealOption().meal, id: 'meal-6', calories: 300, protein: 20, carbs: 20, fat: 10 },
    });
    const slotTarget = {
      mealType: 'SNACK' as MealTypeKey,
      percentage: 10,
      optionCount: 1,
      calories: 10,
      protein: 2,
      carbs: 2,
      fat: 1,
    };

    const result = calculateMealOptionAgainstSlot(option, slotTarget, 'SCALE_TO_SLOT_TARGET');

    expect(result.wasClamped).toBe(true);
    expect(result.warnings).toContain('Capped above slot calorie target');
  });

  it('calculates fit score from weighted macro accuracy', () => {
    const option = buildMealOption({
      mealType: 'SNACK',
      meal: { ...buildMealOption().meal, id: 'meal-5', calories: 250, protein: 25, carbs: 20, fat: 8 },
    });
    const slotTarget = {
      mealType: 'SNACK' as MealTypeKey,
      percentage: 10,
      optionCount: 1,
      calories: 250,
      protein: 25,
      carbs: 20,
      fat: 8,
    };

    const result = calculateMealOptionAgainstSlot(option, slotTarget, 'KEEP_PORTIONS');

    expect(result.overallFitScore).toBe(100);
    expect(result.calorieAccuracyPercent).toBe(100);
  });
});
