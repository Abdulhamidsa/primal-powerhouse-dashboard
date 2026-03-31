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
  label: string;
  source: 'ingredient' | 'spice';
};

export type ShoppingListSection = {
  key: 'ingredients' | 'spices';
  title: string;
  items: ShoppingListEntry[];
};

export type GenerateShoppingListResponse = {
  generatedAt: string;
  selectionFingerprint: string;
  sections: ShoppingListSection[];
};
