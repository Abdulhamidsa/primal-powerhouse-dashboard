import { z } from 'zod';
import { sessionStatusEnum, perceivedDifficultyEnum } from '../enums/training.enums';

// Set update during workout
export const updateSetSchema = z.object({
  actualReps: z.number().int().min(0).max(9999).nullable().optional(),
  actualWeightKg: z.number().min(0).max(9999).nullable().optional(),
  completed: z.boolean().optional(),
  skipped: z.boolean().optional(),
  feedback: z.string().max(500).nullable().optional(),
});

export const startTrainingSessionSchema = z.object({
  planDayId: z.string().min(1, 'Plan day ID is required'),
});

export const completeTrainingSessionSchema = z.object({
  status: z.enum(['COMPLETED', 'ABANDONED']),
  perceivedDifficulty: perceivedDifficultyEnum.nullable().optional(),
  overallFeedback: z.string().max(1000).nullable().optional(),
  caloriesBurned: z.number().min(0).nullable().optional(),
});

export const getSessionSchema = z.object({
  sessionId: z.string().min(1),
});

export const getPreviousPerformanceSchema = z.object({
  exerciseId: z.string().min(1),
  clientId: z.string().min(1),
});

export type UpdateSetInput = z.infer<typeof updateSetSchema>;
export type StartTrainingSessionInput = z.infer<typeof startTrainingSessionSchema>;
export type CompleteTrainingSessionInput = z.infer<typeof completeTrainingSessionSchema>;
export type GetSessionInput = z.infer<typeof getSessionSchema>;
export type GetPreviousPerformanceInput = z.infer<typeof getPreviousPerformanceSchema>;
