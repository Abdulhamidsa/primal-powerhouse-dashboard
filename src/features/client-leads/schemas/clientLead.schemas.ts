import { z } from 'zod';

export const addClientLeadSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  subscriptionType: z.string().trim().max(100).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const updateClientLeadStatusSchema = z.object({
  status: z.enum(['CONTACTED', 'HAD_MEETING', 'MADE_DEAL', 'CONVERTED']),
});

export type AddClientLeadInput = z.infer<typeof addClientLeadSchema>;
export type UpdateClientLeadStatusInput = z.infer<typeof updateClientLeadStatusSchema>;
