import type { MealTypeKey } from '@/features/meals/types/mealSelection.types';

export const SHOPPING_LIST_DRAFT_STORAGE_KEY = 'user-plan-shopping-list-draft-v1';

export type ShoppingListDraftMealItem = {
  mealType: MealTypeKey;
  slotIndex: number;
  mealId: string;
  sourceAssignmentId: string | null;
};

export function saveShoppingListDraft(items: ShoppingListDraftMealItem[]): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SHOPPING_LIST_DRAFT_STORAGE_KEY, JSON.stringify(items));
}

export function loadShoppingListDraft(): ShoppingListDraftMealItem[] {
  if (typeof window === 'undefined') return [];

  const raw = window.sessionStorage.getItem(SHOPPING_LIST_DRAFT_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(item => {
        if (!item || typeof item !== 'object') return null;
        const value = item as Record<string, unknown>;

        const mealType = typeof value.mealType === 'string' ? value.mealType : null;
        const slotIndex = typeof value.slotIndex === 'number' ? value.slotIndex : null;
        const mealId = typeof value.mealId === 'string' ? value.mealId : null;
        const sourceAssignmentId =
          typeof value.sourceAssignmentId === 'string'
            ? value.sourceAssignmentId
            : value.sourceAssignmentId == null
              ? null
              : undefined;

        if (!mealType || slotIndex === null || !mealId) return null;

        return {
          mealType: mealType as MealTypeKey,
          slotIndex,
          mealId,
          sourceAssignmentId,
        };
      })
      .filter((item): item is ShoppingListDraftMealItem => item !== null);
  } catch {
    return [];
  }
}
