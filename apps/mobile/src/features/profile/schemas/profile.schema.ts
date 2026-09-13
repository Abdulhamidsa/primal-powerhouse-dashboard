import { z } from 'zod';
export const feedbackSchema = z.object({ message: z.string().trim().min(1).max(1000) });
export const avatarSchema = z.object({ avatar: z.string().url().nullable() });
