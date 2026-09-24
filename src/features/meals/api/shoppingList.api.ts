import { httpClient } from '@/lib/http/client';
import type {
  GenerateShoppingListInput,
  GenerateShoppingListResponse,
} from '@/features/meals/types/shoppingList.types';

export const USER_SHOPPING_LIST_URL = '/api/user/meals/shopping-list';

export async function getSavedShoppingList() {
  return httpClient.get<GenerateShoppingListResponse>(USER_SHOPPING_LIST_URL);
}

export async function generateShoppingList(payload: GenerateShoppingListInput) {
  return httpClient.post<GenerateShoppingListResponse>(USER_SHOPPING_LIST_URL, payload);
}
