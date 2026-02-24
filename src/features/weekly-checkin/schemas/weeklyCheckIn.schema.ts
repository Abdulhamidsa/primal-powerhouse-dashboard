import { z } from 'zod';

const nullableNumber = z.number().finite().nullable().optional();

export const weekStartDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid week start date');

export const weeklyCheckInPayloadSchema = z
  .object({
    weightKg: nullableNumber,
    waistCm: nullableNumber,
    trainingAdherence: z.number().int().min(0).max(100),
    nutritionAdherence: z.number().int().min(0).max(100),
    energyRating: z.number().int().min(1).max(5),
    stressRating: z.number().int().min(1).max(5),
    hungerRating: z.number().int().min(1).max(5),
    digestionRating: z.number().int().min(1).max(5),
    sleepHours: nullableNumber,
    strengthUpdate: z.string().trim().max(300).nullable().optional(),
    blockerText: z.string().trim().max(300).nullable().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .refine(
    value =>
      value.weightKg != null ||
      value.waistCm != null ||
      (value.strengthUpdate != null && value.strengthUpdate.trim().length > 0),
    {
      message: 'Provide at least one of weight, waist, or strength update',
      path: ['strengthUpdate'],
    }
  );

export const weeklyCheckInUpsertSchema = z.object({
  weekStartDate: weekStartDateSchema,
  payload: weeklyCheckInPayloadSchema,
});
