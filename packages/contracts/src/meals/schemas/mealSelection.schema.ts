import { z } from 'zod';

const mealTypeSchema = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);

export const saveMealSelectionItemSchema = z.object({
  mealType: mealTypeSchema,
  slotIndex: z.number().int().min(0),
  mealId: z.string().trim().min(1),
  sourceAssignmentId: z.string().trim().min(1).optional().nullable(),
});

export const saveMealSelectionSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    items: z.array(saveMealSelectionItemSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const counters = {
      BREAKFAST: 0,
      LUNCH: 0,
      DINNER: 0,
      SNACK: 0,
    };

    const uniqueSlots = new Set<string>();

    value.items.forEach((item, index) => {
      counters[item.mealType] += 1;

      const slotKey = `${item.mealType}:${item.slotIndex}`;
      if (uniqueSlots.has(slotKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate meal slot detected',
          path: ['items', index, 'slotIndex'],
        });
      }
      uniqueSlots.add(slotKey);

      if (item.mealType !== 'SNACK' && item.slotIndex !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Breakfast, lunch, and dinner must use slotIndex 0',
          path: ['items', index, 'slotIndex'],
        });
      }

      if (item.mealType === 'SNACK' && item.slotIndex > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Snack slotIndex must be 0 or 1',
          path: ['items', index, 'slotIndex'],
        });
      }
    });

    if (counters.BREAKFAST > 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Maximum one breakfast allowed', path: ['items'] });
    }

    if (counters.LUNCH > 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Maximum one lunch allowed', path: ['items'] });
    }

    if (counters.DINNER > 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Maximum one dinner allowed', path: ['items'] });
    }

    if (counters.SNACK > 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Maximum of two snacks allowed', path: ['items'] });
    }
  });

export type SaveMealSelectionInput = z.infer<typeof saveMealSelectionSchema>;
