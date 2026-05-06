import { z } from 'zod';
import { planStatusEnum, sourceTypeEnum } from '../enums/training.enums';

export const createClientTrainingPlanSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  name: z.string().min(1, 'Plan name is required').max(255),
  description: z.string().max(1000).nullable().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  status: planStatusEnum.default('ACTIVE'),
});

export const updateClientTrainingPlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  status: planStatusEnum.optional(),
  endDate: z.coerce.date().nullable().optional(),
});

export type CreateClientTrainingPlanInput = z.infer<typeof createClientTrainingPlanSchema>;
export type UpdateClientTrainingPlanInput = z.infer<typeof updateClientTrainingPlanSchema>;
