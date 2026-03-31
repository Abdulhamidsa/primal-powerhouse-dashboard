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

export type MealSlotSummary = {
  mealType: string;
  included: boolean;
  coverageDays: number;
  expectedDays: number;
  target: RecalculationMacroTargets;
  projected: RecalculationMacroTargets;
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
  slotSummaries: MealSlotSummary[];
  deltas: MealPortionDelta[];
  warning: string | null;
  mode: RecalculationMode;
};

export type MealPlanRecalculationResponse = {
  success: boolean;
  result: MealPlanRecalculationResult;
};
