import { z } from 'zod';

export const dailyNutritionStatusSchema = z.enum(['ON_PLAN', 'PARTIAL', 'OFF_PLAN']);

export const dayDateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid day date key');

export const upsertDailyNutritionSchema = z.object({
  dayDate: dayDateKeySchema,
  status: dailyNutritionStatusSchema,
  note: z.string().trim().max(280).nullable().optional(),
});
