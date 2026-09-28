import { z } from 'zod';

export const settingsUpdateSchema = z.object({
  profile: z.object({
    name: z.string().trim().min(1).max(200).optional(),
    email: z.string().trim().email().max(320).optional(),
  }).strict(),
}).strict();

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
