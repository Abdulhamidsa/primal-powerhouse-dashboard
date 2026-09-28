import { z } from 'zod';

export const scheduleQuerySchema = z.object({
  clientId: z.string().trim().min(1).max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

export type ScheduleQuery = z.infer<typeof scheduleQuerySchema>;
