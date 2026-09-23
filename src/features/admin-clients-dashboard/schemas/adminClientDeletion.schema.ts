import { z } from 'zod';

export const adminClientDeletionSchema = z.object({
  confirmation: z.literal('DELETE'),
});
