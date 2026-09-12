import { z } from 'zod';

export const dailyTrainingStatusSchema = z.enum(['DONE', 'PARTIAL', 'MISSED']);

export const dayDateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid day date key');

export const upsertDailyTrainingSchema = z.object({
  dayDate: dayDateKeySchema,
  status: dailyTrainingStatusSchema,
  note: z.string().trim().max(280).nullable().optional(),
});
