import useSWR from 'swr';
import {
  getExerciseDbExerciseById,
  getExerciseDbExercises,
  getExerciseDbFilterOptions,
} from '@/features/exercises/api/exerciseDb.api';
import type {
  ExerciseDbOptionsResponse,
  ExerciseDbResponse,
  ExerciseDbSingleResponse,
} from '@/features/exercises/types/exerciseDb.types';

interface UseExerciseDbExercisesParams {
  offset: number;
  limit: number;
  query: string;
  muscles?: string;
  equipment?: string;
  bodyParts?: string;
  sortBy?: 'name' | 'exerciseId' | 'targetMuscles' | 'bodyParts' | 'equipments';
  sortOrder?: 'asc' | 'desc';
}

export function useExerciseDbExercises({
  offset,
  limit,
  query,
  muscles = '',
  equipment = '',
  bodyParts = '',
  sortBy = 'name',
  sortOrder = 'asc',
}: UseExerciseDbExercisesParams) {
  const trimmedQuery = query.trim();
  const trimmedMuscles = muscles.trim();
  const trimmedEquipment = equipment.trim();
  const trimmedBodyParts = bodyParts.trim();

  const { data, error, isLoading, mutate } = useSWR<ExerciseDbResponse>(
    [
      'exercise-db-exercises',
      offset,
      limit,
      trimmedQuery,
      trimmedMuscles,
      trimmedEquipment,
      trimmedBodyParts,
      sortBy,
      sortOrder,
    ],
    ([, o, l, q, m, e, b, sBy, sOrder]) =>
      getExerciseDbExercises({
        offset: o as number,
        limit: l as number,
        q: q as string,
        muscles: m as string,
        equipment: e as string,
        bodyParts: b as string,
        sortBy: sBy as any,
        sortOrder: sOrder as any,
      }),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 1000 * 60 * 60 * 24,
    }
  );

  return {
    exercises: data?.data ?? [],
    metadata: data?.metadata,
    isLoading,
    error: error instanceof Error ? error.message : (data?.error ?? null),
    refresh: mutate,
  };
}

export function useExerciseDbFilterOptions() {
  const { data, error, isLoading, mutate } = useSWR<ExerciseDbOptionsResponse>(
    'exercise-db-options',
    () => getExerciseDbFilterOptions(),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 1000 * 60 * 60 * 24 * 7,
    }
  );

  return {
    options: data?.data ?? { muscles: [], equipments: [], bodyParts: [] },
    isLoading,
    error: error instanceof Error ? error.message : (data?.error ?? null),
    refresh: mutate,
  };
}

export function useExerciseDbExercise(exerciseId: string) {
  const { data, error, isLoading, mutate } = useSWR<ExerciseDbSingleResponse>(
    exerciseId ? ['exercise-db-exercise', exerciseId] : null,
    () => getExerciseDbExerciseById(exerciseId),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 1000 * 60 * 60 * 24,
    }
  );

  return {
    exercise: data?.data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : (data?.error ?? null),
    refresh: mutate,
  };
}
