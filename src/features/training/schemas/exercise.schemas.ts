import { z } from 'zod';
import { muscleGroupEnum, equipmentEnum } from '../enums/training.enums';

export const createExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(255),
  description: z.string().max(1000).nullable().optional(),
  muscleGroup: muscleGroupEnum,
  muscleGroupSecondary: muscleGroupEnum.nullable().optional(),
  equipment: equipmentEnum.nullable().optional(),
  videoUrl: z.string().url('Invalid video URL').nullable().optional(),
  imageUrl: z.string().url('Invalid image URL').nullable().optional(),
  instructions: z.string().max(5000).nullable().optional(),
  defaultSets: z.number().int().min(1).max(20).nullable().optional(),
  defaultReps: z.number().int().min(1).max(100).nullable().optional(),
  defaultRestSeconds: z.number().int().min(0).max(600).nullable().optional(),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export const importExerciseDbExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  name: z.string().min(1).max(255),
  gifUrl: z.string().url().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  targetMuscles: z.array(z.string()).optional(),
  bodyParts: z.array(z.string()).optional(),
  equipments: z.array(z.string()).optional(),
  secondaryMuscles: z.array(z.string()).optional(),
  instructions: z.array(z.string()).optional(),
  overview: z.string().nullable().optional(),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type ImportExerciseDbExerciseInput = z.infer<typeof importExerciseDbExerciseSchema>;
