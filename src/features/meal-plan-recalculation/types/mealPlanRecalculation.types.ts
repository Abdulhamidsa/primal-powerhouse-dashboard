import type { z } from 'zod';
import type {
  mealPlanRecalculationSchema,
  optimizationModeSchema,
  recalculationModeSchema,
} from '@/features/meal-plan-recalculation/schemas/mealPlanRecalculation.schema';

export type RecalculationMode = z.infer<typeof recalculationModeSchema>;
export type OptimizationMode = z.infer<typeof optimizationModeSchema>;
export type MealPlanRecalculationPayload = z.infer<typeof mealPlanRecalculationSchema>;

export type MealPortionDelta = {
  assignmentId: string;
  mealName: string;
  mealType: string;
  dayOfWeek: number;
  oldPortion: number;
  newPortion: number;
  wasClampedByBounds: boolean;
};

export type RecalculationMacroTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealSlotNormalizationStatus = 'normalized' | 'partially_normalized' | 'missing';

export type MealPlanRecalculationValidationStatus = 'ok' | 'warning' | 'blocked';
export type MealPlanRecalculationTargetStatus =
  | 'ok'
  | 'warning'
  | 'blocked'
  | 'needsAdditionalMeals'
  | 'targetUnreachableWithCurrentAssignments';

export type MealSuitabilityStatus = 'good' | 'borderline' | 'poor';
export type MealReplacementPriority = 'high' | 'medium' | 'low';

export type MealReplacementOpportunity = {
  assignmentId: string;
  mealName: string;
  mealType: string;
  dayOfWeek: number;
  calories: number;
  protein: number;
  currentProtein: number;
  proteinPer100Kcal: number;
  targetProteinPer100Kcal: number;
  targetCaloriesRange: {
    min: number;
    max: number;
  };
  targetProteinRange: {
    min: number;
    max: number;
  };
  suggestedReplacementType: string;
  coachingMessage: string;
  estimatedProteinIncrease: {
    min: number;
    max: number;
  };
  suitabilityStatus: MealSuitabilityStatus;
  suitabilityScore: number;
  priority: MealReplacementPriority;
  contributionToRemainingProteinGap: number;
  reason: string;
};

export type MealPlanRecommendedAddition = {
  type: string;
  daysNeeded: number;
  targetCaloriesPerDay: {
    min: number;
    max: number;
  };
  targetProteinPerDay: {
    min: number;
    max: number;
  };
  reason: string;
};

export type MealPlanRecalculationValidation = {
  status: MealPlanRecalculationValidationStatus;
  canApply: boolean;
  calorieAccuracyPercent: number;
  proteinGapPercent: number;
  reasons: string[];
  targetStatus: MealPlanRecalculationTargetStatus;
  summaryReason: string | null;
};

export type MealSlotSummary = {
  mealType: string;
  included: boolean;
  normalizationStatus: MealSlotNormalizationStatus;
  coverageDays: number;
  expectedDays: number;
  target: RecalculationMacroTargets;
  targetLabel: string;
  targetHint: string | null;
  projected: RecalculationMacroTargets;
  proteinPer100Kcal: number;
  suitabilityStatus: MealSuitabilityStatus;
  suitabilityReasons: string[];
  expectedAccuracyPercent: number | null;
  hasBoundsClamping: boolean;
  warning: string | null;
};

export type MealPlanRecalculationResult = {
  mealPlanId: string;
  clientId: string;
  basePlanUpdatedAt: string;
  optimizationMode: OptimizationMode;
  adjustmentsApplied: number;
  targets: RecalculationMacroTargets;
  projectedTotals: RecalculationMacroTargets;
  expectedAccuracyPercent: number;
  hasBoundsClamping: boolean;
  validation: MealPlanRecalculationValidation;
  recommendedAdditions: MealPlanRecommendedAddition[];
  replacementOpportunities: MealReplacementOpportunity[];
  slotSummaries: MealSlotSummary[];
  deltas: MealPortionDelta[];
  warning: string | null;
  mode: RecalculationMode;
};

export type MealPlanRecalculationResponse = {
  success: boolean;
  result: MealPlanRecalculationResult;
};
