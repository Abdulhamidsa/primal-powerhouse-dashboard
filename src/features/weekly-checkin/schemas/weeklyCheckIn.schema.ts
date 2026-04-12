import { z } from 'zod';

const nullableNumber = z.number().finite().nullable().optional();

export const weekStartDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid week start date');

export const weeklyCheckInPayloadSchema = z
  .object({
    weightKg: nullableNumber,
    progressPhotoFrontUrl: z.string().trim().url().max(1500).nullable().optional(),
    progressPhotoSideUrl: z.string().trim().url().max(1500).nullable().optional(),
    progressPhotoBackUrl: z.string().trim().url().max(1500).nullable().optional(),
    strengthUpdate: z.string().trim().max(300).nullable().optional(),
    blockerText: z.string().trim().max(300).nullable().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .refine(
    value =>
      value.weightKg != null ||
      value.progressPhotoFrontUrl != null ||
      value.progressPhotoSideUrl != null ||
      value.progressPhotoBackUrl != null ||
      (value.strengthUpdate != null && value.strengthUpdate.trim().length > 0),
    {
      message: 'Provide at least one of weight, progress photo, or strength update',
      path: ['strengthUpdate'],
    },
  );

export const weeklyCheckInUpsertSchema = z.object({
  weekStartDate: weekStartDateSchema,
  payload: weeklyCheckInPayloadSchema,
});
