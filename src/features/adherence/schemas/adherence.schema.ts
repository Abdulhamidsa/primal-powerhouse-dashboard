import { z } from 'zod';
import { dayDateKeySchema } from '@/features/daily-nutrition/schemas/dailyNutrition.schema';

export const adherenceMealTypeSchema = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);

export const toggleMealCompletionSchema = z.object({
  dayDate: dayDateKeySchema,
  mealType: adherenceMealTypeSchema,
  slotIndex: z.number().int().min(0).max(9),
  mealId: z.string().trim().min(1),
  sourceAssignmentId: z.string().trim().min(1).nullable().optional(),
  portion: z.number().positive().max(10),
  calories: z.number().nonnegative().max(10000),
  protein: z.number().nonnegative().max(1000),
  carbs: z.number().nonnegative().max(1000),
  fat: z.number().nonnegative().max(1000),
});

export const dailyIntakeOverrideSchema = z.object({
  dayDate: dayDateKeySchema,
  calories: z.number().nonnegative().max(10000),
  protein: z.number().nonnegative().max(1000),
  carbs: z.number().nonnegative().max(1000),
  fat: z.number().nonnegative().max(1000),
  note: z.string().trim().max(280).nullable().optional(),
});
