import { z } from 'zod';

export const profileAvatarPayloadSchema = z
  .object({
    avatar: z.string().trim().url().min(1),
  })
  .strict();
