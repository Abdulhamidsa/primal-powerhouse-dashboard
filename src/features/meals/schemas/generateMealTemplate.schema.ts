import { z } from 'zod';

const cuisineOriginSchema = z.enum([
  'Middle Eastern',
  'Western',
  'Greek',
  'Mediterranean',
  'Mexican',
  'Italian',
  'Asian',
  'Indian',
]);

export const generateMealTemplateRequestSchema = z.object({
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  strictMatchMode: z.enum(['strict', 'lenient']).default('strict'),
  foodOrigin: cuisineOriginSchema.optional(),
  avoidCoreDishReferences: z.array(z.string().trim().min(1).max(120)).max(12).optional(),
  avoidMealNames: z.array(z.string().trim().min(1).max(140)).max(20).optional(),
});

export const mealTemplateAiResponseSchema = z.object({
  mealName: z.string().trim().min(3).max(120),
  cuisineStyle: cuisineOriginSchema,
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
  spices: z.array(z.string().trim().min(2).max(80)).max(16).optional(),
  instructions: z.array(z.string().trim().min(3).max(220)).min(4).max(6),
});

export const unmatchedIngredientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  grams: z.number().positive().max(1000),
});

export const generatedMealTemplateIngredientSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(2).max(120),
  kcalPer100g: z.number().nonnegative(),
  proteinPer100g: z.number().nonnegative(),
  carbsPer100g: z.number().nonnegative(),
  fatPer100g: z.number().nonnegative(),
  fiberPer100g: z.number().nonnegative(),
  grams: z.number().positive().max(1000),
  servingUnit: z.enum(['g', 'piece']).optional(),
  gramsPerUnit: z.number().positive().nullable().optional(),
  displayUnitLabel: z.string().nullable().optional(),
});

export const rematchMealIngredientsRequestSchema = z.object({
  unmatchedIngredients: z.array(unmatchedIngredientSchema).min(1).max(12),
});

export type GenerateMealTemplateRequest = z.infer<typeof generateMealTemplateRequestSchema>;
export type MealTemplateAiResponse = z.infer<typeof mealTemplateAiResponseSchema>;
export type RematchMealIngredientsRequest = z.infer<typeof rematchMealIngredientsRequestSchema>;
