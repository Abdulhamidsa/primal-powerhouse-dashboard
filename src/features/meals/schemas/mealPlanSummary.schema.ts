import { z } from 'zod';

const mealTypeKeySchema = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);

const mealMacroTotalsSchema = z.object({
  calories: z.number().finite(),
  protein: z.number().finite(),
  carbs: z.number().finite(),
  fat: z.number().finite(),
});

const sideSelectionOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['SALAD', 'SOUP']),
  calories: z.number().finite(),
  protein: z.number().finite(),
  carbs: z.number().finite(),
  fat: z.number().finite(),
  fiber: z.number().finite().nullable(),
  imageUrl: z.string().nullable(),
  ingredients: z.array(z.string()),
  spices: z.array(z.string()),
  instructions: z.array(z.string()),
  foodOrigin: z.string().nullable(),
});

const mealSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  description: z.string().nullable(),
  calories: z.number().finite(),
  protein: z.number().finite(),
  carbs: z.number().finite(),
  fat: z.number().finite(),
  ingredients: z.string().nullable(),
  spices: z.string().nullable(),
  instructions: z.string().nullable(),
  category: z.string().nullable(),
  difficulty: z.string().nullable(),
  imageUrl: z.string().nullable(),
  prepTime: z.number().finite().nullable(),
  cookTime: z.number().finite().nullable(),
  servings: z.number().finite().nullable(),
  tags: z.string().nullable(),
});

const mealOptionSchema = z.object({
  sourceAssignmentId: z.string(),
  mealType: mealTypeKeySchema,
  portion: z.number().finite(),
  scheduledTime: z.string().nullable(),
  side: sideSelectionOptionSchema.nullable(),
  meal: mealSchema,
});

const mealSelectionItemSchema = mealOptionSchema.extend({
  slotIndex: z.number().int().min(0),
});

const mealSelectionBlockSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
  items: z.array(mealSelectionItemSchema),
});

export const mealPlanSummarySchema = z.object({
  optionsByType: z.record(mealTypeKeySchema, z.array(mealOptionSchema)),
  baselineSelection: z.array(mealSelectionItemSchema),
  baselineTotals: mealMacroTotalsSchema,
  coachTargets: mealMacroTotalsSchema.nullable().optional(),
  constraints: z.object({
    required: z.array(mealTypeKeySchema),
    snackMax: z.number().int().min(0),
  }),
  selection: mealSelectionBlockSchema,
  baseline: z.object({
    items: z.array(mealSelectionItemSchema),
    totals: mealMacroTotalsSchema,
  }),
  selectedTotals: mealMacroTotalsSchema,
  delta: mealMacroTotalsSchema,
  hasSavedSelection: z.boolean().optional(),
});

