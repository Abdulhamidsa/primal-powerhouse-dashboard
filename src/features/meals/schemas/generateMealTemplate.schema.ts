import { z } from 'zod';

export const generateMealTemplateRequestSchema = z.object({
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  strictMatchMode: z.enum(['strict', 'lenient']).default('strict'),
  avoidCoreDishReferences: z.array(z.string().trim().min(1).max(120)).max(12).optional(),
  avoidMealNames: z.array(z.string().trim().min(1).max(140)).max(20).optional(),
});

export const mealTemplateAiResponseSchema = z.object({
  mealName: z.string().trim().min(3).max(120),
  cuisineStyle: z.enum(['Middle Eastern', 'Western', 'Greek', 'Mediterranean', 'Mexican', 'Italian', 'Asian']),
  coreDishReference: z.string().trim().min(3).max(120),
  complexity: z.enum(['simple', 'advanced']),
  servings: z.number().int().min(1).max(6),
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(120),
        grams: z.number().positive().max(1000),
      }),
    )
    .min(2)
    .max(8),
  instructions: z.array(z.string().trim().min(3).max(220)).min(4).max(6),
});

export type GenerateMealTemplateRequest = z.infer<typeof generateMealTemplateRequestSchema>;
export type MealTemplateAiResponse = z.infer<typeof mealTemplateAiResponseSchema>;
