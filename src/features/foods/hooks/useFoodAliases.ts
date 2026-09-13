'use client';

import { useSWRConfig } from 'swr';
import { createFoodAlias } from '@/features/foods/api/foodAliases.api';
import type { CreateFoodAliasPayload } from '@/features/foods/types/food.types';

export function useCreateFoodAlias() {
  const { mutate } = useSWRConfig();

  const submit = async (payload: CreateFoodAliasPayload) => {
    const created = await createFoodAlias(payload);
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/foods'));
    return created;
  };

  return { submit };
}
