import { z } from 'zod';

export const nutritionStatusSchema = z.enum(['ON_PLAN', 'PARTIAL', 'OFF_PLAN']);

export const macroTargetSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

export const comparisonSourceSchema = z.enum(['client_goal', 'planned_meals', 'none']);

export const dailyNutritionComparisonSchema = z.object({
  dateKey: z.string(),
  status: nutritionStatusSchema.nullable(),
  adherenceFactor: z.number().nullable(),
  source: comparisonSourceSchema,
  target: macroTargetSchema.nullable(),
  actual: macroTargetSchema.nullable(),
  remaining: macroTargetSchema.nullable(),
});

export const nutritionComparisonSummarySchema = z.object({
  avgTargetCalories: z.number().nullable(),
  avgActualCalories: z.number().nullable(),
  avgRemainingCalories: z.number().nullable(),
  daysWithIntakeData: z.number(),
  lookbackDays: z.number(),
});

export const clientNutritionComparisonResponseSchema = z.object({
  client: z.object({
    id: z.string(),
    name: z.string(),
  }),
  estimationNote: z.string(),
  today: dailyNutritionComparisonSchema,
  summary: nutritionComparisonSummarySchema,
  days: z.array(dailyNutritionComparisonSchema),
});
