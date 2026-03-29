import { z } from 'zod';

export const sideTypeSchema = z.enum(['SALAD', 'SOUP']);

export const sideFoodOriginSchema = z.enum([
  'Middle Eastern',
  'Western',
  'Greek',
  'Mediterranean',
  'Mexican',
  'Italian',
  'Asian',
  'Indian',
]);

const sideArrayFieldSchema = z.array(z.string().trim().min(1)).min(1).max(16);

const generatedSideMatchedIngredientSchema = z.object({
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

export const sideEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: sideTypeSchema,
  imageUrl: z.string().url().nullish(),
  calories: z.number().nonnegative().max(80),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative().nullable().optional(),
  ingredients: sideArrayFieldSchema,
  spices: z.array(z.string().trim().min(1)).max(16).default([]),
  instructions: z.array(z.string().trim().min(1)).min(2).max(6),
  foodOrigin: sideFoodOriginSchema.nullish(),
  mealAssignmentId: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createSideSchema = z.object({
  name: z.string().trim().min(3).max(120),
  type: sideTypeSchema,
  imageUrl: z.string().url().optional(),
  calories: z.number().positive().max(80),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative().nullable().optional(),
  ingredients: sideArrayFieldSchema,
  spices: z.array(z.string().trim().min(1)).max(16).default([]),
  instructions: z.array(z.string().trim().min(1)).min(2).max(6),
  foodOrigin: sideFoodOriginSchema.optional(),
  clientId: z.string().optional(),
});

export const generateSideSchema = z.object({
  mealType: z.enum(['LUNCH', 'DINNER']),
  sideType: sideTypeSchema,
  foodOrigin: sideFoodOriginSchema.optional(),
  clientId: z.string().optional(),
  avoidSideNames: z.array(z.string().trim().min(1).max(140)).max(12).optional(),
});

export const generatedSideTemplateSchema = z.object({
  name: z.string().trim().min(3).max(120),
  type: sideTypeSchema,
  imageUrl: z.string().url().optional(),
  calories: z.number().positive().max(80),
  protein: z.number().nonnegative().max(20),
  carbs: z.number().nonnegative().max(20),
  fat: z.number().nonnegative().max(20),
  fiber: z.number().nonnegative().max(10).optional(),
  ingredients: sideArrayFieldSchema,
  spices: z.array(z.string().trim().min(1)).max(16).default([]),
  instructions: z.array(z.string().trim().min(1)).min(2).max(6),
  foodOrigin: sideFoodOriginSchema.optional(),
  matchedIngredients: z.array(generatedSideMatchedIngredientSchema).max(12).optional(),
  unmatchedIngredients: z.array(z.string().trim().min(1).max(120)).max(16).optional(),
  warnings: z.array(z.string().trim().min(1).max(220)).max(12).optional(),
});
