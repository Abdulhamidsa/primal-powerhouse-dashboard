import type { MealTypeKey } from '@/features/meals/types/mealSelection.types';

export type ShoppingListSourceItem = {
  mealType: MealTypeKey;
  slotIndex: number;
  mealId: string;
  sourceAssignmentId?: string | null;
};

export type GenerateShoppingListInput = {
  items: ShoppingListSourceItem[];
};

export type ShoppingListEntry = {
  id: string;
  /** Ingredient name only, no quantity */
  label: string;
  /** Display quantity, e.g. "350g" or "2 tbsp" — may be undefined for spices or unlabelled items */
  quantity?: string;
  source: 'ingredient' | 'spice';
};

export type ShoppingListSection = {
  key: 'proteins' | 'vegetables' | 'carbs' | 'spices' | 'other';
  title: string;
  items: ShoppingListEntry[];
};

export type GenerateShoppingListResponse = {
  generatedAt: string;
  selectionFingerprint: string;
  sections: ShoppingListSection[];
};
