import type { z } from 'zod';
import type { mealPlanSummarySchema } from '@/features/meals/schemas/mealPlanSummary.schema';

export type MealPlanSummaryResponse = z.infer<typeof mealPlanSummarySchema>;

