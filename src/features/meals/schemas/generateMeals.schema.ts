import { z } from 'zod';

export const generateMealsSchema = z.object({
  calories: z.number().positive(),
  protein: z.number().nonnegative(),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  mealCount: z.number().int().min(1).max(10).optional(),
  generateImages: z.boolean().optional(),
  imageProvider: z.enum(['azure', 'local-sd']).optional(),
  imageCheckpoint: z.string().trim().min(1).max(120).optional(),
  imageQualityProfile: z.enum(['fast', 'balanced', 'high']).optional(),
});

export type GenerateMealsSchema = z.infer<typeof generateMealsSchema>;
