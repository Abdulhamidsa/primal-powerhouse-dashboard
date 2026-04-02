'use client';

import { useEffect, useState } from 'react';
import { fetchMainProteinOptionsApi } from '@/features/meals/api/mealTemplateGeneration.api';
import type { MainProteinOption, ProteinSelectableMealType } from '@/features/meals/types/mealTemplateGeneration.types';

export function useMainProteinOptions(mealType: ProteinSelectableMealType | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<MainProteinOption[]>([]);

  useEffect(() => {
    if (!mealType) {
      setOptions([]);
      setError(null);
      return;
    }

    let isMounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMainProteinOptionsApi(mealType);
        if (!isMounted) return;
        setOptions(data);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Failed to load protein options';
        setError(message);
        setOptions([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [mealType]);

  return {
    loading,
    error,
    options,
  } as const;
}

export default useMainProteinOptions;
