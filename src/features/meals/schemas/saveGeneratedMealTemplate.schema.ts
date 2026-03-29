import { z } from 'zod';

const matchedIngredientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  displayName: z.string().nullable().optional(),
  canonicalName: z.string().nullable().optional(),
  matchedInput: z.string().optional(),
  grams: z.number().positive(),
  matchScore: z.number().optional(),
  caloriesKcal: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  fiberG: z.number().nullable().optional(),
});

const generatedMealSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  ingredients: z.array(matchedIngredientSchema).min(1),
  spices: z.array(z.string().trim().min(2).max(80)).max(16).optional(),
  instructions: z.array(z.string().trim().min(3).max(220)).max(8).optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export const saveGeneratedMealTemplateSchema = z.object({
  meal: generatedMealSchema,
  force: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1)).max(12).optional(),
});

export type SaveGeneratedMealTemplateSchema = z.infer<typeof saveGeneratedMealTemplateSchema>;
