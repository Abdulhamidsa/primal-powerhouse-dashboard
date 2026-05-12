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
  'Syrian',
  'Japanese',
  'Korean',
  'Thai',
  'Turkish',
]);

export const generateMealTemplateRequestSchema = z.object({
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  strictMatchMode: z.enum(['strict', 'lenient']).default('strict'),
  foodOrigin: cuisineOriginSchema.optional(),
  preferredProtein: z.string().trim().min(2).max(80).optional(),
  helperText: z.string().trim().max(800).optional(),
  avoidCoreDishReferences: z.array(z.string().trim().min(1).max(120)).max(12).optional(),
  avoidMealNames: z.array(z.string().trim().min(1).max(140)).max(30).optional(),
  avoidCuisines: z.array(z.string().trim().min(1).max(60)).max(10).optional(),
  avoidCookingMethods: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
});

const estimatedMacrosPer100gSchema = z.object({
  caloriesKcal: z.number().nonnegative().max(900),
  proteinG: z.number().nonnegative().max(100),
  carbsG: z.number().nonnegative().max(100),
  fatG: z.number().nonnegative().max(100),
  fiberG: z.number().nonnegative().max(100),
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
        estimatedMacrosPer100g: estimatedMacrosPer100gSchema.optional(),
      }),
    )
    .min(2)
    .max(8),
  spices: z.array(z.string().trim().min(2).max(80)).max(16).optional(),
  instructions: z.array(z.string().trim().min(3).max(220)).min(4).max(6),
});

export const estimatedMacrosSchema = z.object({
  caloriesKcal: z.number().nonnegative().max(900),
  proteinG: z.number().nonnegative().max(100),
  carbsG: z.number().nonnegative().max(100),
  fatG: z.number().nonnegative().max(100),
  fiberG: z.number().nonnegative().max(100),
});

export const unmatchedIngredientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  grams: z.number().positive().max(1000),
  estimatedMacrosPer100g: estimatedMacrosSchema.optional(),
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
