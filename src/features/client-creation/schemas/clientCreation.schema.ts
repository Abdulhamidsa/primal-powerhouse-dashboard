import { z } from 'zod';

export const clientGenderSchema = z.enum(['MALE', 'FEMALE']).nullable().optional();

export const createClientSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email(),
    phone: z.string().trim().min(1).max(30),
    avatar: z.string().trim().url().optional().or(z.literal('')),
    gender: clientGenderSchema,
    currentWeight: z.number().finite().min(20).max(350),
    targetWeight: z.number().finite().min(20).max(350),
    height: z.number().finite().min(90).max(260),
    age: z.number().int().min(10).max(120),
    activityLevel: z.enum(['LOW', 'MODERATE', 'HIGH']),
    dietaryRestrictions: z.array(z.string().trim()),
    goals: z.array(z.string().trim().min(1)).min(1),
    notes: z.string().trim().max(10000).optional().or(z.literal('')),
    sessionsCompleted: z.number().int().min(0).optional(),
    progressPhotos: z.array(z.string()).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
    password: z.string().trim().min(1).max(128).optional().or(z.literal('')),
    coachId: z.string().trim().optional(),
  })
  .strict();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateClientGender = z.infer<typeof clientGenderSchema>;
