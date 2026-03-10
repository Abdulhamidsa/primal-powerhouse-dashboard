import { z } from 'zod';

export const recalculationModeSchema = z.enum(['preview', 'apply']);
export const optimizationModeSchema = z.enum(['portion_only', 'macro_optimized']);

export const mealPlanRecalculationSchema = z.object({
  newDailyCalories: z.coerce.number().int().min(900).max(6000),
  mode: recalculationModeSchema.default('preview'),
  optimizationMode: optimizationModeSchema.default('macro_optimized'),
  maxMealAdjustments: z.coerce.number().int().min(1).max(6).default(2),
  reason: z.string().trim().max(500).optional(),
  basePlanUpdatedAt: z.string().datetime(),
});

export type MealPlanRecalculationInput = z.infer<typeof mealPlanRecalculationSchema>;
