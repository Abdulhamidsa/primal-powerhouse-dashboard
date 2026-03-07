'use client';

import useSWR, { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/request';
import { buildFoodsUrl, createFood, getFoodById, getFoods, updateFood } from '@/features/foods/api/foods.api';
import type { CreateFoodPayload, FoodsSearchParams, UpdateFoodPayload } from '@/features/foods/types/food.types';

export function useFoods(params?: FoodsSearchParams) {
  const key = buildFoodsUrl(params);
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, () => getFoods(params));

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isValidating,
    error: error as ApiError | undefined,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useFood(id?: string) {
  const key = id ? `/api/foods/catalog/${id}` : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, () => (id ? getFoodById(id) : null));

  return {
    item: data ?? null,
    isLoading,
    isValidating,
    error: error as ApiError | undefined,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useCreateFood() {
  const { mutate } = useSWRConfig();

  const submit = async (payload: CreateFoodPayload) => {
    const created = await createFood(payload);
    await mutate((key: string) => key.startsWith('/api/foods'));
    return created;
  };

  return { submit };
}

export function useUpdateFood() {
  const { mutate } = useSWRConfig();

  const submit = async (id: string, payload: UpdateFoodPayload) => {
    const updated = await updateFood(id, payload);
    await mutate(`/api/foods/catalog/${id}`);
    await mutate((key: string) => key.startsWith('/api/foods'));
    return updated;
  };

  return { submit };
}
