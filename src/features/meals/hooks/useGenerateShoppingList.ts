import { useCallback, useState } from 'react';
import type { ApiError } from '@/lib/request';
import { generateShoppingList } from '@/features/meals/api/shoppingList.api';
import type {
  GenerateShoppingListInput,
  GenerateShoppingListResponse,
} from '@/features/meals/types/shoppingList.types';

export function useGenerateShoppingList() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<GenerateShoppingListResponse | null>(null);

  const run = useCallback(async (payload: GenerateShoppingListInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateShoppingList(payload);
      setData(response);
      return response;
    } catch (requestError) {
      setError(requestError as ApiError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    data,
    run,
  };
}
