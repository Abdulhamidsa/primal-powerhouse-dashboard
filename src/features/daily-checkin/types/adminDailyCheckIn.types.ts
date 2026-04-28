import type { z } from 'zod';
import type {
  dailyCheckInEnergySchema,
  dailyCheckInHungerSchema,
  dailyCheckInRecordSchema,
  dailyCheckInSleepSchema,
} from '@/features/daily-checkin/schemas/dailyCheckIn.schema';
import type { dailyNutritionStatusSchema } from '@/features/daily-nutrition/schemas/dailyNutrition.schema';
import type { dailyTrainingStatusSchema } from '@/features/daily-training/schemas/dailyTraining.schema';

export type AdminDailyCheckInEnergy = z.infer<typeof dailyCheckInEnergySchema>;
export type AdminDailyCheckInHunger = z.infer<typeof dailyCheckInHungerSchema>;
export type AdminDailyCheckInSleep = z.infer<typeof dailyCheckInSleepSchema>;
export type AdminDailyNutritionStatus = z.infer<typeof dailyNutritionStatusSchema>;
export type AdminDailyTrainingStatus = z.infer<typeof dailyTrainingStatusSchema>;

export type AdminDailyCheckInListItem = z.infer<typeof dailyCheckInRecordSchema> & {
  reviewed: boolean;
  reviewedAt: string | null;
};

export type AdminClientDailyCheckInsResponse = {
  client: {
    id: string;
    name: string;
  };
  range: {
    startDate: string;
    endDate: string;
    days: number;
  };
  latestCheckIn: {
    id: string;
    submittedAt: string;
    dayDate: string;
  } | null;
  summary: {
    submittedCount: number;
    reviewedCount: number;
    averageCompletionPercentage: number;
    latestSubmittedAt: string | null;
  };
  checkIns: AdminDailyCheckInListItem[];
};
