'use client';

import useSWR from 'swr';
import type { ApiError } from '@/lib/request';
import {
  TRAINING_PLAN_URL,
  buildTrainingPlanDayUrl,
  getTrainingPlan,
  getTrainingPlanDay,
} from '@/features/training/api/trainingPlan.api';
import type { TrainingPlanDTO, TrainingPlanDayLookupDTO } from '@/features/training/types/clientTraining.types';

export function useTrainingPlan() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<TrainingPlanDTO | null, ApiError>(
    TRAINING_PLAN_URL,
    async () => {
      try {
        return await getTrainingPlan();
      } catch (error) {
        if ((error as ApiError).status === 404) return null;
        throw error;
      }
    },
  );

  return {
    plan: data ?? null,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useTrainingPlanDay(dateKey?: string) {
  const key = dateKey ? buildTrainingPlanDayUrl(dateKey) : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR<TrainingPlanDayLookupDTO | null, ApiError>(
    key,
    async () => {
      if (!dateKey) return null;
      try {
        return await getTrainingPlanDay(dateKey);
      } catch (error) {
        if ((error as ApiError).status === 404) return null;
        throw error;
      }
    },
  );

  return {
    planDay: data?.day ?? null,
    planId: data?.planId ?? null,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}
