import { z } from 'zod';

const setLogSchema = z.object({
  reps: z.number().int().min(0).max(9999),
  weightKg: z.number().min(0).max(9999),
  completed: z.boolean().default(true),
});

const exerciseLogSchema = z.object({
  planExerciseId: z.string().min(1),
  completedAt: z.string().nullable(),
  feedback: z.enum(['TOO_EASY', 'FELT_GOOD', 'TOO_HEAVY', 'FORM_ISSUE', 'PAIN_DISCOMFORT']).nullable().optional(),
  feedbackNote: z.string().max(500).nullable().optional(),
  sets: z.array(setLogSchema).min(1).max(30),
});

export const completeSessionSchema = z.object({
  status: z.enum(['COMPLETED', 'ABANDONED']),
  exerciseLogs: z.array(exerciseLogSchema),
});

export type CompleteSessionPayload = z.infer<typeof completeSessionSchema>;
