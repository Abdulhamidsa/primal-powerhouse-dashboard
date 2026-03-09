import { z } from 'zod';

const nullableMetric = z.number().finite().nullable().optional();
const nullableAge = z.number().int().min(10).max(120).nullable().optional();
const genderSchema = z.enum(['MALE', 'FEMALE']).nullable().optional();
const activityLevelSchema = z.enum(['LOW', 'MODERATE', 'HIGH']).nullable().optional();

export const clientProfileEditSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    age: nullableAge,
    gender: genderSchema,
    activityLevel: activityLevelSchema,
    height: nullableMetric,
    currentWeight: nullableMetric,
    targetWeight: nullableMetric,
  })
  .strict()
  .refine(value => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export const clientProfileEditFormSchema = z.object({
  name: z.string().trim().min(2).max(100),
  age: z.number().int().min(10).max(120).nullable(),
  gender: z.enum(['MALE', 'FEMALE']).nullable(),
  activityLevel: z.enum(['LOW', 'MODERATE', 'HIGH']).nullable(),
  height: z.number().finite().min(90).max(260).nullable(),
  currentWeight: z.number().finite().min(20).max(350).nullable(),
  targetWeight: z.number().finite().min(20).max(350).nullable(),
});
