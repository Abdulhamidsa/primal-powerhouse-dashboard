import type { z } from 'zod';
import type {
  healthMetricsActivityOverrideSchema,
  healthMetricsFormulaPreferenceSchema,
  healthMetricsGoalSchema,
  healthMetricsModeSchema,
  healthMetricsRequestSchema,
} from '@/features/health-metrics/schemas/healthMetrics.schema';
import type { HealthMetricsOutput } from '@/lib/health/calculators';

export type HealthMetricsGoal = z.infer<typeof healthMetricsGoalSchema>;
export type HealthMetricsFormulaPreference = z.infer<typeof healthMetricsFormulaPreferenceSchema>;
export type HealthMetricsMode = z.infer<typeof healthMetricsModeSchema>;
export type HealthMetricsActivityOverride = z.infer<typeof healthMetricsActivityOverrideSchema>;
export type HealthMetricsRequestPayload = z.infer<typeof healthMetricsRequestSchema>;

export type HealthMetricsCalculateResponse = {
  success: boolean;
  applied: boolean;
  metrics: HealthMetricsOutput;
  client?: {
    id: string;
    name: string;
    currentWeight: number;
    goalCalories: number;
  };
};

export type HealthMetricsSaveNotesResponse = {
  success: boolean;
  notes: string[];
};
