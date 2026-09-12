import type { MealTypeKey } from '@primal/contracts/meals/types/mealSelection.types';

export type {
  MealOption,
  SelectionItem,
  MealOptionsResponse,
  MealSelectionResponse,
  SaveMealSelectionInput,
  MealTypeKey,
  SideSelectionOption,
} from '@primal/contracts/meals/types/mealSelection.types';
export type { GenerateShoppingListResponse } from '@primal/contracts/meals/types/shoppingList.types';
export type Completion = { mealId: string; mealType: string; slotIndex: number };
export type Adherence = { dayDate: string; completions: Completion[] };
export type MealPickerState = { type: MealTypeKey; slot: number; sidesOnly?: boolean };
