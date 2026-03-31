import { z } from 'zod';
import { saveMealSelectionItemSchema } from '@/features/meals/schemas/mealSelection.schema';

export const generateShoppingListSchema = z.object({
  items: z.array(saveMealSelectionItemSchema).min(1),
});

export type GenerateShoppingListInput = z.infer<typeof generateShoppingListSchema>;
