'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  EXERCISE_CATALOG_CACHE_TTL_MS,
  getExerciseCatalogExerciseById,
  getExerciseCatalogExercises,
  getExerciseCatalogFilterOptions,
} from '@/features/exercises/api/exerciseCatalog.api';
import type {
  ExerciseCatalogOptionsResponse,
  ExerciseCatalogQueryParams,
  ExerciseCatalogResponse,
  ExerciseCatalogSingleResponse,
} from '@/features/exercises/types/exerciseCatalog.types';

export function useExerciseCatalogExercises(params: ExerciseCatalogQueryParams, options: { enabled?: boolean } = {}) {
  const paramsKey = JSON.stringify(params);
  const [debouncedParams, setDebouncedParams] = useState(params);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedParams(JSON.parse(paramsKey) as ExerciseCatalogQueryParams);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [paramsKey]);

  const { data, error, isLoading, mutate } = useSWR<ExerciseCatalogResponse>(
    options.enabled === false ? null : ['exercise-catalog', debouncedParams],
    () => getExerciseCatalogExercises(debouncedParams),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: EXERCISE_CATALOG_CACHE_TTL_MS,
    },
  );
  return {
    exercises: data?.data ?? [],
    metadata: data?.metadata,
    isLoading,
    error: error instanceof Error ? error.message : (data?.error ?? null),
    refresh: mutate,
  };
}

export function useExerciseCatalogFilterOptions() {
  const { data, error, isLoading, mutate } = useSWR<ExerciseCatalogOptionsResponse>(
    'exercise-catalog-options',
    getExerciseCatalogFilterOptions,
    { revalidateOnFocus: false, revalidateIfStale: false, dedupingInterval: 1000 * 60 * 60 * 24 * 7 },
  );
  return {
    options: data?.data ?? { muscles: [], equipments: [], bodyParts: [] },
    isLoading,
    error: error instanceof Error ? error.message : (data?.error ?? null),
    refresh: mutate,
  };
}

export function useExerciseCatalogExercise(exerciseId: string) {
  const { data, error, isLoading, mutate } = useSWR<ExerciseCatalogSingleResponse>(
    exerciseId ? ['exercise-catalog-exercise', exerciseId] : null,
    () => getExerciseCatalogExerciseById(exerciseId),
    { revalidateOnFocus: false, revalidateIfStale: false, dedupingInterval: 1000 * 60 * 60 * 24 },
  );
  return {
    exercise: data?.data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : (data?.error ?? null),
    refresh: mutate,
  };
}
