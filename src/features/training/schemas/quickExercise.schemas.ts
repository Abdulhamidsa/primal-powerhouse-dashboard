import { z } from 'zod';

export const quickExerciseMediaKindEnum = z.enum(['IMAGE', 'VIDEO']);

export const quickExerciseCreateSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(255),
  description: z.string().max(1000).optional(),
  mediaKind: quickExerciseMediaKindEnum,
});

export type QuickExerciseCreateInput = z.infer<typeof quickExerciseCreateSchema>;
