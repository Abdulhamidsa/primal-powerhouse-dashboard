import type { z } from 'zod';
import type {
  dailyCheckInCurrentResponseSchema,
  dailyCheckInEnergySchema,
  dailyCheckInHungerSchema,
  dailyCheckInSleepSchema,
  dailyCheckInHistoryItemSchema,
  dailyCheckInInsightsResponseSchema,
  dailyCheckInPayloadSchema,
  dailyCheckInRecordSchema,
  dailyCheckInUpsertResponseSchema,
  dailyCheckInWeightTrendDirectionSchema,
} from '@/features/daily-checkin/schemas/dailyCheckIn.schema';

export type DailyCheckInEnergy = z.infer<typeof dailyCheckInEnergySchema>;
export type DailyCheckInHunger = z.infer<typeof dailyCheckInHungerSchema>;
export type DailyCheckInSleep = z.infer<typeof dailyCheckInSleepSchema>;
export type DailyCheckInPayload = z.infer<typeof dailyCheckInPayloadSchema>;
export type DailyCheckInRecord = z.infer<typeof dailyCheckInRecordSchema>;
export type DailyCheckInCurrentResponse = z.infer<typeof dailyCheckInCurrentResponseSchema>;
export type DailyCheckInUpsertResponse = z.infer<typeof dailyCheckInUpsertResponseSchema>;
export type DailyCheckInWeightTrendDirection = z.infer<typeof dailyCheckInWeightTrendDirectionSchema>;
export type DailyCheckInHistoryItem = z.infer<typeof dailyCheckInHistoryItemSchema>;
export type DailyCheckInInsightsResponse = z.infer<typeof dailyCheckInInsightsResponseSchema>;
