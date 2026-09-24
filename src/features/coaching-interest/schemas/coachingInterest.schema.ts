import { z } from 'zod';

export const coachingInterestResponseSchema = z.object({
  requested: z.boolean(),
  requestedAt: z.string().datetime().nullable(),
});

export const adminCoachingInterestStatusSchema = z.enum(['pending', 'contacted', 'all']);

export const adminCoachingInterestSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  clientAvatar: z.string().nullable(),
  email: z.string().email(),
  phone: z.string().nullable(),
  requestedAt: z.string().datetime(),
  message: z.string(),
  contactedAt: z.string().datetime().nullable(),
  contactedById: z.string().nullable(),
});

export const adminCoachingInterestListResponseSchema = z.object({
  items: z.array(adminCoachingInterestSchema),
  pendingCount: z.number().int().nonnegative(),
});

export const updateAdminCoachingInterestSchema = z.object({
  contacted: z.boolean(),
});
