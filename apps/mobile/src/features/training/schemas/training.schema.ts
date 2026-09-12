export {
  startTrainingSessionSchema,
  updateSetSchema,
  completeTrainingSessionSchema,
} from '@primal/contracts/training/schemas/session.schemas';
export { completeSessionSchema } from '@primal/contracts/workout-session/schemas/workoutSession.schemas';

import { z } from 'zod';

export const assignedVideoDetailSchema = z.object({
  id: z.string().min(1),
  assignedDate: z.string(),
  dueDate: z.string().nullable().optional(),
  scheduledTime: z.string().nullable().optional(),
  isCompleted: z.boolean(),
  completedAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  video: z.object({
    id: z.string().min(1),
    title: z.string(),
    description: z.string().nullable(),
    duration: z.number(),
    difficulty: z.string(),
    videoUrl: z.string().url(),
    thumbnailUrl: z.string().nullable().optional(),
    equipment: z.array(z.string()).default([]),
    muscleGroups: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    instructions: z.array(z.string()).default([]),
    tips: z.array(z.string()).default([]),
  }),
});
