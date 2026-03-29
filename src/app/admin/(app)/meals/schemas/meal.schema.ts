import { z } from 'zod';

const mealTypeSchema = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);

const numericString = (fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .refine(value => !Number.isNaN(Number(value)), {
      message: `Valid ${fieldName.toLowerCase()} required`,
    });

export const addMealFormSchema = z.object({
  name: z.string().trim().min(1, 'Meal name is required'),
  type: mealTypeSchema,
  calories: numericString('Calories'),
  protein: numericString('Protein'),
  carbs: numericString('Carbs'),
  fat: numericString('Fat'),
  fiber: z
    .string()
    .trim()
    .refine(value => value === '' || !Number.isNaN(Number(value)), {
      message: 'Valid fiber amount required',
    }),
  prepTime: numericString('Prep time'),
  cookTime: numericString('Cook time'),
  servings: z
    .string()
    .trim()
    .refine(value => value === '' || !Number.isNaN(Number(value)), {
      message: 'Valid servings required',
    }),
  ingredients: z.array(z.string()).refine(items => items.some(item => item.trim()), {
    message: 'At least one ingredient required',
  }),
  spices: z.array(z.string()),
  instructions: z.array(z.string()).refine(items => items.some(item => item.trim()), {
    message: 'At least one instruction required',
  }),
  tags: z.array(z.string()),
});

export type AddMealFormData = z.infer<typeof addMealFormSchema>;
