import useSWR from 'swr';
import { useSWRConfig } from 'swr';
import { getCoachExercises, createExercise, updateExercise, deleteExercise } from '../api/coachTraining.api';
import type { CreateExerciseInput, UpdateExerciseInput } from '../schemas/exercise.schemas';
import type { Exercise } from '@prisma/client';

export function useCoachExercises(filters?: { muscleGroup?: string; equipment?: string; search?: string }) {
  const { mutate } = useSWRConfig();
  const key = ['coach-exercises', filters];

  const {
    data,
    error,
    isLoading,
    mutate: mutateLocal,
  } = useSWR(key, () => getCoachExercises(filters), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  const isError = !!error;

  const createExerciseAction = async (input: CreateExerciseInput) => {
    const newExercise = await createExercise(input);
    await mutateLocal();
    return newExercise;
  };

  const updateExerciseAction = async (id: string, input: UpdateExerciseInput) => {
    const updated = await updateExercise(id, input);
    await mutateLocal();
    return updated;
  };

  const deleteExerciseAction = async (id: string) => {
    await deleteExercise(id);
    await mutateLocal();
  };

  return {
    exercises: data,
    isLoading,
    isError,
    error,
    mutate: mutateLocal,
    createExercise: createExerciseAction,
    updateExercise: updateExerciseAction,
    deleteExercise: deleteExerciseAction,
  };
}
