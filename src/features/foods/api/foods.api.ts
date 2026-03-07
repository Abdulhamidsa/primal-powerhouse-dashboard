import { httpClient } from '@/lib/http/client';
import type {
  CreateFoodPayload,
  FoodRecord,
  FoodsListResponse,
  FoodsSearchParams,
  UpdateFoodPayload,
} from '@/features/foods/types/food.types';

export function buildFoodsUrl(params?: FoodsSearchParams): string {
  if (!params) return '/api/foods';

  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set('q', params.q);
  if (params.category) searchParams.set('category', params.category);
  if (params.state) searchParams.set('state', params.state);
  if (typeof params.isActive === 'boolean') searchParams.set('isActive', params.isActive ? '1' : '0');
  if (typeof params.limit === 'number') searchParams.set('limit', `${params.limit}`);

  const query = searchParams.toString();
  return query ? `/api/foods?${query}` : '/api/foods';
}

export async function getFoods(params?: FoodsSearchParams): Promise<FoodsListResponse> {
  return httpClient.get<FoodsListResponse>(buildFoodsUrl(params));
}

export async function createFood(payload: CreateFoodPayload): Promise<FoodRecord> {
  return httpClient.post<FoodRecord>('/api/foods', payload);
}

export async function getFoodById(id: string): Promise<FoodRecord> {
  return httpClient.get<FoodRecord>(`/api/foods/catalog/${id}`);
}

export async function updateFood(id: string, payload: UpdateFoodPayload): Promise<FoodRecord> {
  return httpClient.patch<FoodRecord>(`/api/foods/catalog/${id}`, payload);
}
