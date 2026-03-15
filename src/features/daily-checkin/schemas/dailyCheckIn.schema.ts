import { z } from 'zod';

export const dayDateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid day date key');

export const dailyCheckInComplianceSchema = z.enum(['OFF_PLAN', 'PARTIAL', 'ON_PLAN']);

export const dailyCheckInEnergySchema = z.enum(['LOW', 'NORMAL', 'HIGH']);

export const dailyCheckInPayloadSchema = z
  .object({
    weightKg: z.number().positive().max(500).nullable().optional(),
    compliance: dailyCheckInComplianceSchema.nullable().optional(),
    energy: dailyCheckInEnergySchema.nullable().optional(),
  })
  .refine(
    value => value.weightKg !== undefined || value.compliance !== undefined || value.energy !== undefined,
    'Provide at least one daily check-in field'
  );

export const dailyCheckInUpsertSchema = z.object({
  dayDate: dayDateKeySchema,
  payload: dailyCheckInPayloadSchema,
});

export const dailyCheckInRecordSchema = z.object({
  id: z.string(),
  dayDate: dayDateKeySchema,
  weightKg: z.number().nullable(),
  compliance: dailyCheckInComplianceSchema.nullable(),
  energy: dailyCheckInEnergySchema.nullable(),
  submittedAt: z.string(),
  completionPercentage: z.number().int().min(0).max(100),
  isComplete: z.boolean(),
});

export const dailyCheckInCurrentResponseSchema = z.object({
  dayDate: dayDateKeySchema,
  entry: dailyCheckInRecordSchema.nullable(),
});

export const dailyCheckInUpsertResponseSchema = z.object({
  success: z.literal(true),
  dayDate: dayDateKeySchema,
  entry: dailyCheckInRecordSchema,
});

export const dailyCheckInWeightTrendDirectionSchema = z.enum(['down', 'stable', 'up']);

export const dailyCheckInHistoryItemSchema = z.object({
  dayDate: dayDateKeySchema,
  weightKg: z.number().nullable(),
  completionPercentage: z.number().int().min(0).max(100),
  complianceScore: z.number().int().min(0).max(100),
  isComplete: z.boolean(),
});

export const dailyCheckInInsightsSummarySchema = z.object({
  weightToday: z.number().nullable(),
  currentSevenDayAverage: z.number().nullable(),
  previousSevenDayAverage: z.number().nullable(),
  trendDirection: dailyCheckInWeightTrendDirectionSchema,
  trendDeltaKg: z.number().nullable(),
  weeklyCompliancePercentage: z.number().int().min(0).max(100),
  streakCount: z.number().int().min(0),
  supportiveInsight: z.string(),
});

export const dailyCheckInInsightsResponseSchema = z.object({
  summary: dailyCheckInInsightsSummarySchema,
  history: z.array(dailyCheckInHistoryItemSchema),
});
