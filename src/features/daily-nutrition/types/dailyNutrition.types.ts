import type { z } from 'zod';
import type {
  dailyNutritionStatusSchema,
  upsertDailyNutritionSchema,
} from '@/features/daily-nutrition/schemas/dailyNutrition.schema';

export type DailyNutritionStatus = z.infer<typeof dailyNutritionStatusSchema>;
export type DailyNutritionUpsertPayload = z.infer<typeof upsertDailyNutritionSchema>;

export type DailyNutritionEntry = {
  id: string;
  dayDate: string;
  status: DailyNutritionStatus;
  note: string | null;
  submittedAt: string;
};

export type DailyNutritionCurrentResponse = {
  dayDate: string;
  entry: DailyNutritionEntry | null;
};

export type DailyNutritionUpsertResponse = {
  success: boolean;
  dayDate: string;
  entry: DailyNutritionEntry;
};
