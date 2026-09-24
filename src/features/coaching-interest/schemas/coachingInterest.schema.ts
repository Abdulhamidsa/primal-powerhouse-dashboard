import { z } from 'zod';

export const coachingInterestResponseSchema = z.object({
  requested: z.boolean(),
  requestedAt: z.string().datetime().nullable(),
});
