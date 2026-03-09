import type { z } from 'zod';
import type {
  mealPlanRecalculationSchema,
  recalculationModeSchema,
} from '@/features/meal-plan-recalculation/schemas/mealPlanRecalculation.schema';

export type RecalculationMode = z.infer<typeof recalculationModeSchema>;
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

export type MealPlanRecalculationResult = {
  mealPlanId: string;
  clientId: string;
  basePlanUpdatedAt: string;
  targets: RecalculationMacroTargets;
  projectedTotals: RecalculationMacroTargets;
  expectedAccuracyPercent: number;
  hasBoundsClamping: boolean;
  deltas: MealPortionDelta[];
  warning: string | null;
  mode: RecalculationMode;
};

export type MealPlanRecalculationResponse = {
  success: boolean;
  result: MealPlanRecalculationResult;
};
