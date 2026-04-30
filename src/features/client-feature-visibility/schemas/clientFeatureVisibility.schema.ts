import { z } from 'zod';

export const clientFeatureVisibilitySchema = z.object({
  dailyCheckinsEnabled: z.boolean().optional(),
  dailyWeightEnabled: z.boolean().optional(),
  weeklyCheckinsEnabled: z.boolean().optional(),
  weightChartEnabled: z.boolean().optional(),
  progressPhotosEnabled: z.boolean().optional(),
  nutritionTrackingEnabled: z.boolean().optional(),
  workoutTrackingEnabled: z.boolean().optional(),
}).strict().refine(obj => Object.keys(obj).length > 0, {
  message: 'Provide at least one field to update',
});

export const clientFeatureVisibilityFormSchema = z.object({
  dailyCheckinsEnabled: z.boolean(),
  dailyWeightEnabled: z.boolean(),
  weeklyCheckinsEnabled: z.boolean(),
  weightChartEnabled: z.boolean(),
  progressPhotosEnabled: z.boolean(),
  nutritionTrackingEnabled: z.boolean(),
  workoutTrackingEnabled: z.boolean(),
}).strict();
