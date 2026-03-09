import { z } from 'zod';

export const recalculationModeSchema = z.enum(['preview', 'apply']);

export const mealPlanRecalculationSchema = z.object({
  newDailyCalories: z.coerce.number().int().min(900).max(6000),
  mode: recalculationModeSchema.default('preview'),
  reason: z.string().trim().max(500).optional(),
  basePlanUpdatedAt: z.string().datetime(),
});

export type MealPlanRecalculationInput = z.infer<typeof mealPlanRecalculationSchema>;
