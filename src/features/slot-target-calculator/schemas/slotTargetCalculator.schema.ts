import { z } from 'zod';

const mealTypeSchema = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);
const macroModeSchema = z.enum(['percentage', 'grams']);
const scalingModeSchema = z.enum(['SCALE_TO_SLOT_TARGET', 'KEEP_PORTIONS']);
const applyModeSchema = z.enum(['UPDATE_PORTIONS_ONLY', 'APPLY_STRUCTURE_TO_WEEK', 'REWRITE_RECIPES_TO_SLOT_TARGET']);

const mealDistributionSchema = z.object({
  BREAKFAST: z.object({ percentage: z.number().finite() }),
  LUNCH: z.object({ percentage: z.number().finite() }),
  DINNER: z.object({ percentage: z.number().finite() }),
  SNACK: z.object({ percentage: z.number().finite() }),
});

export const slotTargetCalculatorSettingsSchema = z.object({
  targetCalories: z.number().finite().positive(),
  macroMode: macroModeSchema,
  proteinPercentage: z.number().finite(),
  carbPercentage: z.number().finite(),
  fatPercentage: z.number().finite(),
  proteinGrams: z.number().finite(),
  carbGrams: z.number().finite(),
  fatGrams: z.number().finite(),
  scalingMode: scalingModeSchema,
  mealDistribution: mealDistributionSchema,
});

export const slotTargetCalculatorApplyRequestSchema = z.object({
  clientId: z.string().trim().min(1),
  selectionSetId: z.string().trim().min(1).optional(),
  mode: z.enum(['preview', 'apply']),
  applyMode: applyModeSchema,
  settings: slotTargetCalculatorSettingsSchema,
});

export const slotTargetCalculatorApplyResponseSchema = z.object({
  mealPlanId: z.string(),
  applyMode: applyModeSchema,
  affectedMealTypes: z.array(mealTypeSchema),
  canApply: z.boolean().optional(),
  assignmentsToCreate: z.number().int().nonnegative().optional(),
  assignmentsToUpdate: z.number().int().nonnegative().optional(),
  assignmentsToReplace: z.number().int().nonnegative().optional(),
  mealsToCreate: z.number().int().nonnegative().optional(),
  mealsToUpdate: z.number().int().nonnegative().optional(),
  assignmentsToRepoint: z.number().int().nonnegative().optional(),
  warnings: z.array(z.string()),
  mealTypeSummaries: z.array(
    z.object({
      mealType: mealTypeSchema,
      optionCount: z.number().int().nonnegative(),
      currentAssignments: z.number().int().nonnegative(),
      plannedAssignments: z.number().int().nonnegative(),
      assignmentsToCreate: z.number().int().nonnegative(),
      assignmentsToUpdate: z.number().int().nonnegative(),
      assignmentsToReplace: z.number().int().nonnegative(),
      uniqueMealCount: z.number().int().nonnegative().optional(),
      assignmentsAffected: z.number().int().nonnegative().optional(),
      mealsToCreate: z.number().int().nonnegative().optional(),
      mealsToUpdate: z.number().int().nonnegative().optional(),
      targetCalories: z.number().finite().optional(),
      targetProtein: z.number().finite().optional(),
      targetCarbs: z.number().finite().optional(),
      targetFat: z.number().finite().optional(),
      warnings: z.array(z.string()).optional(),
    }),
  ),
  updatedAssignments: z.number().int().nonnegative().optional(),
});

export type SlotTargetCalculatorSettingsInput = z.infer<typeof slotTargetCalculatorSettingsSchema>;
export type SlotTargetCalculatorApplyRequest = z.infer<typeof slotTargetCalculatorApplyRequestSchema>;
export type SlotTargetCalculatorApplyResponse = z.infer<typeof slotTargetCalculatorApplyResponseSchema>;
