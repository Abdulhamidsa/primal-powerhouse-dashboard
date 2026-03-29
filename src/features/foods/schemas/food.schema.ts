import { z } from 'zod';

export const foodCategorySchema = z.enum(['protein', 'carb', 'fat', 'dairy', 'fruit', 'vegetable', 'extra']);
export const foodStateSchema = z.enum(['raw', 'dry', 'as_sold', 'cooked']);
export const foodSourceSchema = z.enum(['system', 'custom']);
export const foodBaseUnitSchema = z.enum(['100g', 'unit']);

const nutritionNumberSchema = z.number().min(0).max(9999);

const foodSchemaBase = z.object({
  name: z.string().trim().min(2).max(120),
  category: foodCategorySchema,
  state: foodStateSchema,
  caloriesKcal: nutritionNumberSchema,
  proteinG: nutritionNumberSchema,
  carbsG: nutritionNumberSchema,
  fatG: nutritionNumberSchema,
  fiberG: nutritionNumberSchema.nullable().optional(),
  source: foodSourceSchema.default('custom'),
  isActive: z.boolean().default(true),
  sourceRef: z.string().trim().min(1).max(200).nullable().optional(),
  verifiedAt: z.string().datetime().nullable().optional(),
  verifiedBy: z.string().trim().min(1).max(120).nullable().optional(),
  baseUnit: foodBaseUnitSchema,
  gramsPerUnit: z.number().positive().max(5000).nullable().optional(),
  displayUnitLabel: z.string().trim().min(1).max(40).nullable().optional(),
});

function validateUnitFields(
  value: { baseUnit?: '100g' | 'unit'; gramsPerUnit?: number | null; displayUnitLabel?: string | null },
  ctx: z.RefinementCtx,
) {
  if (value.baseUnit === 'unit') {
    if (!value.gramsPerUnit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['gramsPerUnit'],
        message: 'gramsPerUnit is required when baseUnit is unit',
      });
    }
    if (!value.displayUnitLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['displayUnitLabel'],
        message: 'displayUnitLabel is required when baseUnit is unit',
      });
    }
  }
}

export const createFoodSchema = foodSchemaBase.superRefine((value, ctx) => {
  validateUnitFields(value, ctx);
});

export const updateFoodSchema = foodSchemaBase.partial().superRefine((value, ctx) => {
  // Only enforce unit companion fields when baseUnit is explicitly set to unit on update.
  validateUnitFields(value, ctx);
});

export const createFoodAliasSchema = z.object({
  foodId: z.string().trim().min(1),
  alias: z.string().trim().min(2).max(120),
  updateMacros: z
    .object({
      caloriesKcal: nutritionNumberSchema,
      proteinG: nutritionNumberSchema,
      carbsG: nutritionNumberSchema,
      fatG: nutritionNumberSchema,
      fiberG: nutritionNumberSchema.nullable(),
    })
    .optional(),
});
