import type { z } from 'zod';
import type {
  dailyTrainingStatusSchema,
  upsertDailyTrainingSchema,
} from '@/features/daily-training/schemas/dailyTraining.schema';

export type DailyTrainingStatus = z.infer<typeof dailyTrainingStatusSchema>;
export type DailyTrainingUpsertPayload = z.infer<typeof upsertDailyTrainingSchema>;

export type DailyTrainingEntry = {
  id: string;
  dayDate: string;
  status: DailyTrainingStatus;
  note: string | null;
  submittedAt: string;
};

export type DailyTrainingCurrentResponse = {
  dayDate: string;
  entry: DailyTrainingEntry | null;
};

export type DailyTrainingUpsertResponse = {
  success: boolean;
  dayDate: string;
  entry: DailyTrainingEntry;
};
