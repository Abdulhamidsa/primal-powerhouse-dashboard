import { clampPortion, getPortionBounds } from '../../meal-plan-recalculation/lib/recalculation';
import type { MealOption, MealTypeKey } from '../../meals/types/mealSelection.types';
import {
  DEFAULT_MEAL_DISTRIBUTION,
  MEAL_TYPE_ORDER,
  type MacroMode,
  type MacroTargets,
  type MealDistributionState,
  type MealDistributionValidation,
  type MealOptionGroups,
  type SlotTarget,
  type SlotTargetCalculatorSettings,
  type SlotTargetPreview,
  type SlotTargetPreviewItem,
  type ScalingMode,
} from '../types/slotTargetCalculator.types';

const MACRO_TARGET_MISMATCH_TOLERANCE_KCAL = 25;
const ACCURACY_TOLERANCE_PERCENT = 1.5;
const LOW_PROTEIN_THRESHOLD = 85;

function round0(value: number): number {
  return Math.round(value);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

export function createDefaultMealDistribution(): MealDistributionState {
  return {
    BREAKFAST: { percentage: DEFAULT_MEAL_DISTRIBUTION.BREAKFAST },
    LUNCH: { percentage: DEFAULT_MEAL_DISTRIBUTION.LUNCH },
    DINNER: { percentage: DEFAULT_MEAL_DISTRIBUTION.DINNER },
    SNACK: { percentage: DEFAULT_MEAL_DISTRIBUTION.SNACK },
  };
}

export function createDefaultSlotTargetCalculatorSettings(targetCalories = 2496): SlotTargetCalculatorSettings {
  return {
    targetCalories,
    macroMode: 'percentage',
    proteinPercentage: 30,
    carbPercentage: 40,
    fatPercentage: 30,
    proteinGrams: round1((targetCalories * 0.3) / 4),
    carbGrams: round1((targetCalories * 0.4) / 4),
    fatGrams: round1((targetCalories * 0.3) / 9),
    scalingMode: 'SCALE_TO_SLOT_TARGET',
    mealDistribution: createDefaultMealDistribution(),
  };
}

export function calculateAccuracyPercent(target: number, actual: number): number {
  if (target <= 0) {
    return actual <= 0 ? 100 : 0;
  }

  const accuracy = 1 - Math.abs(actual - target) / target;
  return Math.max(0, Math.min(100, round1(accuracy * 100)));
}

export function calculateMacroTargets(settings: Pick<
  SlotTargetCalculatorSettings,
  | 'targetCalories'
  | 'macroMode'
  | 'proteinPercentage'
  | 'carbPercentage'
  | 'fatPercentage'
  | 'proteinGrams'
  | 'carbGrams'
  | 'fatGrams'
>): { targets: MacroTargets; totalMacroCalories: number; warning: string | null } {
  if (settings.macroMode === 'percentage') {
    const protein = round1((settings.targetCalories * settings.proteinPercentage) / 100 / 4);
    const carbs = round1((settings.targetCalories * settings.carbPercentage) / 100 / 4);
    const fat = round1((settings.targetCalories * settings.fatPercentage) / 100 / 9);
    const totalMacroCalories = round0(protein * 4 + carbs * 4 + fat * 9);
    const macroDifference = totalMacroCalories - round0(settings.targetCalories);

    return {
      targets: {
        calories: round0(settings.targetCalories),
        protein,
        carbs,
        fat,
      },
      totalMacroCalories,
      warning:
        Math.abs(macroDifference) > MACRO_TARGET_MISMATCH_TOLERANCE_KCAL
          ? macroDifference > 0
            ? `Macro total is ${macroDifference} kcal above target.`
            : `Macro total is ${Math.abs(macroDifference)} kcal below target.`
          : null,
    };
  }

  const protein = round1(settings.proteinGrams);
  const carbs = round1(settings.carbGrams);
  const fat = round1(settings.fatGrams);
  const totalMacroCalories = round0(protein * 4 + carbs * 4 + fat * 9);
  const calorieGap = Math.abs(totalMacroCalories - settings.targetCalories);

  return {
    targets: {
      calories: round0(settings.targetCalories),
      protein,
      carbs,
      fat,
    },
    totalMacroCalories,
    warning:
      calorieGap > MACRO_TARGET_MISMATCH_TOLERANCE_KCAL
        ? totalMacroCalories > settings.targetCalories
          ? `Macro total is ${totalMacroCalories - round0(settings.targetCalories)} kcal above target.`
          : `Macro total is ${Math.abs(totalMacroCalories - round0(settings.targetCalories))} kcal below target.`
        : null,
  };
}

export function validateMealDistribution(mealDistribution: MealDistributionState): MealDistributionValidation {
  const totalPercentage = MEAL_TYPE_ORDER.reduce((sum, mealType) => sum + clampPercent(mealDistribution[mealType]?.percentage ?? 0), 0);
  const issues: string[] = [];

  if (Math.abs(totalPercentage - 100) > 0.1) {
    issues.push(`Meal distribution must total 100%. Current total is ${round1(totalPercentage)}%.`);
  }

  return {
    isValid: issues.length === 0,
    totalPercentage: round1(totalPercentage),
    issues,
  };
}

export function calculateSlotTargets(
  targets: MacroTargets,
  mealDistribution: MealDistributionState,
  optionCounts?: Partial<Record<MealTypeKey, number>>,
): Record<MealTypeKey, SlotTarget> {
  return MEAL_TYPE_ORDER.reduce(
    (acc, mealType) => {
      const percentage = clampPercent(mealDistribution[mealType]?.percentage ?? 0);
      acc[mealType] = {
        mealType,
        percentage,
        optionCount: optionCounts?.[mealType] ?? 0,
        calories: round0((targets.calories * percentage) / 100),
        protein: round1((targets.protein * percentage) / 100),
        carbs: round1((targets.carbs * percentage) / 100),
        fat: round1((targets.fat * percentage) / 100),
      };
      return acc;
    },
    {} as Record<MealTypeKey, SlotTarget>,
  );
}

function buildWarnings(args: {
  wasClamped: boolean;
  calculated: MacroTargets;
  slotTarget: SlotTarget;
  scalingMode: ScalingMode;
}): string[] {
  const warnings = new Set<string>();
  const calorieDifference = args.calculated.calories - args.slotTarget.calories;

  if (args.scalingMode === 'KEEP_PORTIONS') {
    warnings.add('Locked portion');
  } else if (args.wasClamped) {
    warnings.add(calorieDifference >= 0 ? 'Capped above slot calorie target' : 'Capped below slot calorie target');
  } else if (Math.abs(calorieDifference) > ACCURACY_TOLERANCE_PERCENT) {
    warnings.add(calorieDifference > 0 ? 'Above slot calorie target' : 'Below slot calorie target');
  }

  if (args.calculated.protein < args.slotTarget.protein * (LOW_PROTEIN_THRESHOLD / 100)) {
    warnings.add('Below slot protein target');
  }

  return Array.from(warnings);
}

export function calculateMealOptionAgainstSlot(
  mealOption: MealOption,
  slotTarget: SlotTarget,
  scalingMode: ScalingMode,
): SlotTargetPreviewItem {
  const baseMacros = {
    calories: round1(mealOption.meal.calories),
    protein: round1(mealOption.meal.protein),
    carbs: round1(mealOption.meal.carbs),
    fat: round1(mealOption.meal.fat),
  };
  const safePortionBounds = getPortionBounds(slotTarget.mealType);
  const basePortion = mealOption.portion > 0 ? mealOption.portion : 1;

  let portionMultiplier = basePortion;
  let wasClamped = false;

  if (scalingMode === 'SCALE_TO_SLOT_TARGET') {
    const rawMultiplier = baseMacros.calories > 0 ? slotTarget.calories / baseMacros.calories : 1;
    const clamped = clampPortion(rawMultiplier, slotTarget.mealType);
    portionMultiplier = clamped.value;
    wasClamped = clamped.clamped;
  }

  const calculatedMacros = {
    calories: round0(baseMacros.calories * portionMultiplier),
    protein: round1(baseMacros.protein * portionMultiplier),
    carbs: round1(baseMacros.carbs * portionMultiplier),
    fat: round1(baseMacros.fat * portionMultiplier),
  };

  const calorieAccuracyPercent = calculateAccuracyPercent(slotTarget.calories, calculatedMacros.calories);
  const proteinAccuracyPercent = calculateAccuracyPercent(slotTarget.protein, calculatedMacros.protein);
  const carbAccuracyPercent = calculateAccuracyPercent(slotTarget.carbs, calculatedMacros.carbs);
  const fatAccuracyPercent = calculateAccuracyPercent(slotTarget.fat, calculatedMacros.fat);
  const macroAccuracyPercent = round1((proteinAccuracyPercent + carbAccuracyPercent + fatAccuracyPercent) / 3);
  const overallFitScore = round1(
    calorieAccuracyPercent * 0.5 +
      proteinAccuracyPercent * 0.3 +
      carbAccuracyPercent * 0.1 +
      fatAccuracyPercent * 0.1,
  );

  return {
    sourceAssignmentId: mealOption.sourceAssignmentId,
    mealType: mealOption.mealType,
    mealId: mealOption.meal.id,
    mealName: mealOption.meal.name,
    mealDescription: mealOption.meal.description ?? null,
    basePortion,
    portionMultiplier: round1(portionMultiplier),
    wasClamped,
    safePortionBounds,
    slotTarget,
    baseMacros,
    calculatedMacros,
    calorieAccuracyPercent,
    proteinAccuracyPercent,
    carbAccuracyPercent,
    fatAccuracyPercent,
    macroAccuracyPercent,
    overallFitScore,
    warnings: buildWarnings({
      wasClamped,
      calculated: calculatedMacros,
      slotTarget,
      scalingMode,
    }),
  };
}

export function calculateSelectionSetSlotPreview(
  optionsByType: MealOptionGroups,
  settings: SlotTargetCalculatorSettings,
): SlotTargetPreview {
  const macroTargetCalculation = calculateMacroTargets(settings);
  const distributionValidation = validateMealDistribution(settings.mealDistribution);
  const optionCounts = Object.fromEntries(
    MEAL_TYPE_ORDER.map(mealType => [mealType, optionsByType[mealType]?.length ?? 0]),
  ) as Partial<Record<MealTypeKey, number>>;
  const slotTargets = calculateSlotTargets(macroTargetCalculation.targets, settings.mealDistribution, optionCounts);

  const groups = MEAL_TYPE_ORDER.map(mealType => {
    const items = (optionsByType[mealType] ?? []).map(option =>
      calculateMealOptionAgainstSlot(option, slotTargets[mealType], settings.scalingMode),
    );

    return {
      mealType,
      target: slotTargets[mealType],
      items,
    };
  });

  const warnings = [
    ...(macroTargetCalculation.warning ? [macroTargetCalculation.warning] : []),
    ...distributionValidation.issues,
  ];

  return {
    macroTargetCalculation,
    distributionValidation,
    slotTargets,
    groups,
    warnings,
  };
}
