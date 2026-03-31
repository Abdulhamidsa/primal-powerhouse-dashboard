import { z } from 'zod';
import {
  CompositeActivitySchema,
  coachingPhaseSchema,
  goalDirectionSchema,
  healthMetricsFormulaPreferenceSchema,
  macroModeSchema,
  occupationActivitySchema,
} from '@/lib/health/calculators';

export const healthMetricsGoalSchema = z.enum([
  'fat_loss',
  'aggressive_cut',
  'recomposition',
  'lean_bulk',
  'maintenance',
  // Backward-compatible legacy goals
  'lose_fat',
  'maintain',
  'gain_muscle',
]);

export { healthMetricsFormulaPreferenceSchema };

export const healthMetricsModeSchema = z.enum(['preview', 'apply']);

export const healthMetricsActivityOverrideSchema = z.enum([
  'SEDENTARY',
  'LIGHT',
  'MODERATE',
  'VERY_ACTIVE',
  'ATHLETE',
  'LOW',
  'HIGH',
]);

export const healthMetricsGoalDirectionSchema = goalDirectionSchema;
export const healthMetricsCoachingPhaseSchema = coachingPhaseSchema;
export const healthMetricsMacroModeSchema = macroModeSchema;
export const healthMetricsOccupationActivitySchema = occupationActivitySchema;
export const healthMetricsCompositeActivitySchema = CompositeActivitySchema;

export const healthMetricsRequestSchema = z.object({
  currentWeight: z.number().finite().min(30).max(250),
  goal: healthMetricsGoalSchema.default('fat_loss'),
  weeklyRatePercent: z.number().finite().min(0.1).max(1.2).optional(),
  bodyFatPercentage: z.number().finite().min(3).max(60).nullable().optional(),
  activityLevelOverride: healthMetricsActivityOverrideSchema.optional(),
  compositeActivity: healthMetricsCompositeActivitySchema.optional(),
  goalDirection: healthMetricsGoalDirectionSchema.optional(),
  coachingPhase: healthMetricsCoachingPhaseSchema.optional(),
  isLeanClient: z.boolean().optional(),
  waistCircumferenceCm: z.number().finite().min(50).max(150).optional(),
  macroMode: healthMetricsMacroModeSchema.optional(),
  formulaPreference: healthMetricsFormulaPreferenceSchema.default('auto'),
  mode: healthMetricsModeSchema.default('apply'),
});

export type HealthMetricsRequestInput = z.infer<typeof healthMetricsRequestSchema>;
