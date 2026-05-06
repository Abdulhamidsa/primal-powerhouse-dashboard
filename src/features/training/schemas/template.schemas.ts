import { z } from 'zod';
import { difficultyLevelEnum, sourceTypeEnum } from '../enums/training.enums';

// Exercise in a template
export const templateExerciseInputSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  order: z.number().int().min(0),
  sets: z.number().int().min(1).max(20).default(3),
  reps: z.number().int().min(1).max(100).default(8),
  restSeconds: z.number().int().min(0).max(600).default(120),
  targetRpe: z.number().min(0).max(10).nullable().optional(),
  targetTempo: z.string().max(50).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const createWorkoutTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  description: z.string().max(1000).nullable().optional(),
  goal: z.string().max(255).nullable().optional(),
  difficulty: difficultyLevelEnum.nullable().optional(),
  exercises: z.array(templateExerciseInputSchema).min(1, 'At least one exercise required').max(50),
});

export const updateWorkoutTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  goal: z.string().max(255).nullable().optional(),
  difficulty: difficultyLevelEnum.nullable().optional(),
  exercises: z.array(templateExerciseInputSchema).min(1).max(50).optional(),
});

export type TemplateExerciseInput = z.infer<typeof templateExerciseInputSchema>;
export type CreateWorkoutTemplateInput = z.infer<typeof createWorkoutTemplateSchema>;
export type UpdateWorkoutTemplateInput = z.infer<typeof updateWorkoutTemplateSchema>;
