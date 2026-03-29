import { httpClient } from '@/lib/http/client';
import type { CreateFoodAliasPayload, FoodAliasRecord } from '@/features/foods/types/food.types';

export async function createFoodAlias(payload: CreateFoodAliasPayload): Promise<FoodAliasRecord> {
  return httpClient.post<FoodAliasRecord>('/api/foods/aliases', payload);
}
