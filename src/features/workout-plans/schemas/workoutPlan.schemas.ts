import { z } from 'zod';

const exerciseInputSchema = z.object({
  videoId: z.string().min(1),
  videoTitle: z.string().max(255).optional(),
  gifUrl: z.string().max(1000).nullable().optional(),
  targetSets: z.number().int().min(1).max(20).optional(),
  minReps: z.number().int().min(1).max(100).optional(),
  maxReps: z.number().int().min(1).max(100).optional(),
  suggestedWeightKg: z.number().min(0).max(1000).nullable().optional(),
  restSeconds: z.number().int().min(0).max(600).optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const createWorkoutPlanSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  exercises: z.array(exerciseInputSchema).min(1).max(30),
});

export const updateWorkoutPlanSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  exercises: z.array(exerciseInputSchema).min(1).max(30).optional(),
});

export type CreateWorkoutPlanInput = z.infer<typeof createWorkoutPlanSchema>;
export type UpdateWorkoutPlanInput = z.infer<typeof updateWorkoutPlanSchema>;
