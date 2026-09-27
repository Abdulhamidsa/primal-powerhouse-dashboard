import { z } from 'zod';

export const updateDisplayNameSchema = z.object({
  name: z.string().trim().max(100, 'Display name must be 100 characters or fewer').transform(value => value || null),
}).strict();

export type UpdateDisplayNameInput = z.infer<typeof updateDisplayNameSchema>;
