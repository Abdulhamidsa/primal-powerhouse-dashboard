import type { MealTypeKey, MealOption } from '../../meals/types/mealSelection.types';

export const MEAL_TYPE_ORDER: MealTypeKey[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
export type { MealTypeKey };

export const DEFAULT_MEAL_DISTRIBUTION: Record<MealTypeKey, number> = {
  BREAKFAST: 25,
  LUNCH: 35,
  DINNER: 30,
  SNACK: 10,
};

export type MacroMode = 'percentage' | 'grams';
export type ScalingMode = 'SCALE_TO_SLOT_TARGET' | 'KEEP_PORTIONS';

export type MacroTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MacroTargetCalculation = {
  targets: MacroTargets;
  totalMacroCalories: number;
  warning: string | null;
};

export type MealDistributionState = Record<
  MealTypeKey,
  {
    percentage: number;
  }
>;

export type MealDistributionValidation = {
  isValid: boolean;
  totalPercentage: number;
  issues: string[];
};

export type SlotTarget = MacroTargets & {
  mealType: MealTypeKey;
  percentage: number;
  optionCount: number;
};

export type SlotTargetPreviewItem = {
  sourceAssignmentId: string;
  mealType: MealTypeKey;
  mealId: string;
  mealName: string;
  mealDescription: string | null;
  basePortion: number;
  portionMultiplier: number;
  wasClamped: boolean;
  safePortionBounds: {
    min: number;
    max: number;
  };
  slotTarget: SlotTarget;
  baseMacros: MacroTargets;
  calculatedMacros: MacroTargets;
  calorieAccuracyPercent: number;
  proteinAccuracyPercent: number;
  carbAccuracyPercent: number;
  fatAccuracyPercent: number;
  macroAccuracyPercent: number;
  overallFitScore: number;
  warnings: string[];
};

export type SlotTargetPreviewGroup = {
  mealType: MealTypeKey;
  target: SlotTarget;
  items: SlotTargetPreviewItem[];
};

export type SlotTargetCalculatorSettings = {
  targetCalories: number;
  macroMode: MacroMode;
  proteinPercentage: number;
  carbPercentage: number;
  fatPercentage: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  scalingMode: ScalingMode;
  mealDistribution: MealDistributionState;
};

export type SlotTargetPreview = {
  macroTargetCalculation: MacroTargetCalculation;
  distributionValidation: MealDistributionValidation;
  slotTargets: Record<MealTypeKey, SlotTarget>;
  groups: SlotTargetPreviewGroup[];
  warnings: string[];
};

export type MealOptionGroups = Record<MealTypeKey, MealOption[]>;

export type SlotTargetApplyMode =
  | 'UPDATE_PORTIONS_ONLY'
  | 'APPLY_STRUCTURE_TO_WEEK'
  | 'REWRITE_RECIPES_TO_SLOT_TARGET';

export type SlotTargetStructureSummary = {
  mealType: MealTypeKey;
  optionCount: number;
  currentAssignments: number;
  plannedAssignments: number;
  assignmentsToCreate: number;
  assignmentsToUpdate: number;
  assignmentsToReplace: number;
  uniqueMealCount?: number;
  assignmentsAffected?: number;
  mealsToCreate?: number;
  mealsToUpdate?: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  warnings?: string[];
};

export type SlotTargetStructureOperation = {
  operation: 'create' | 'update' | 'replace';
  dayOfWeek: number;
  mealType: MealTypeKey;
  mealId: string;
  portion: number;
  existingAssignmentId?: string;
  sourceSelectionItemId: string;
  slotIndex: number;
};

export type SlotTargetApplyPreview = {
  applyMode: SlotTargetApplyMode;
  affectedMealTypes: MealTypeKey[];
  canApply?: boolean;
  assignmentsToCreate: number;
  assignmentsToUpdate: number;
  assignmentsToReplace: number;
  warnings: string[];
  mealTypeSummaries: SlotTargetStructureSummary[];
  mealsToCreate?: number;
  mealsToUpdate?: number;
  assignmentsToRepoint?: number;
};

export type SlotTargetApplyResult = SlotTargetApplyPreview & {
  mealPlanId: string;
  updatedAssignments: number;
};

export type SlotTargetStructureSelectionItem = {
  id: string;
  mealType: MealTypeKey;
  slotIndex: number;
  mealId: string;
  portion: number;
  sourceAssignmentId?: string | null;
  meal: MealOption['meal'];
  side?: MealOption['side'] | null;
};
