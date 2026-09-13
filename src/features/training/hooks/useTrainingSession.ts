'use client';

import useSWR, { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/request';
import {
  completeTrainingSession,
  getTrainingHistory,
  getTrainingPreviousPerformance,
  getTrainingSession,
  skipTrainingPlanDay,
  startTrainingSession,
  updateTrainingSessionSet,
  TRAINING_HISTORY_URL,
  TRAINING_SESSION_URL,
} from '@/features/training/api/trainingSession.api';
import type {
  TrainingHistoryDTO,
  TrainingPreviousPerformanceDTO,
  TrainingSessionDTO,
  TrainingSessionSetDTO,
} from '@/features/training/types/clientTraining.types';
import type {
  CompleteTrainingSessionInput,
  StartTrainingSessionInput,
  UpdateSetInput,
} from '@/features/training/schemas/session.schemas';
import { USER_DASHBOARD_SUMMARY_URL } from '@/features/user-dashboard/api/userDashboard.api';

function isTrainingPlanKey(key: unknown) {
  return typeof key === 'string' && key.startsWith('/api/user/training/plan');
}

export function useTrainingSession(sessionId?: string) {
  const key = sessionId ? `${TRAINING_SESSION_URL}/${encodeURIComponent(sessionId)}` : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR<TrainingSessionDTO, ApiError>(key, () =>
    getTrainingSession(sessionId ?? ''),
  );

  return {
    session: data ?? null,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useTrainingPreviousPerformance(exerciseId?: string) {
  const key = exerciseId ? `/api/user/training/performance/${encodeURIComponent(exerciseId)}` : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR<TrainingPreviousPerformanceDTO, ApiError>(key, () =>
    getTrainingPreviousPerformance(exerciseId ?? ''),
  );

  return {
    previousPerformance: data ?? null,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useTrainingHistory(limit = 10) {
  const key = `${TRAINING_HISTORY_URL}?limit=${limit}`;
  const { data, error, isLoading, isValidating, mutate } = useSWR<TrainingHistoryDTO, ApiError>(key, () =>
    getTrainingHistory(limit),
  );

  return {
    history: data ?? [],
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useTrainingSessionActions() {
  const { mutate } = useSWRConfig();

  return {
    startSession: async (input: StartTrainingSessionInput) => {
      const session = await startTrainingSession(input);
      await Promise.all([
        mutate(TRAINING_SESSION_URL),
        mutate(isTrainingPlanKey),
        mutate(TRAINING_HISTORY_URL),
        mutate(USER_DASHBOARD_SUMMARY_URL),
      ]);
      return session;
    },
    updateSet: async (sessionId: string, setId: string, input: UpdateSetInput): Promise<TrainingSessionSetDTO> => {
      const set = await updateTrainingSessionSet(sessionId, setId, input);
      await mutate(`${TRAINING_SESSION_URL}/${encodeURIComponent(sessionId)}`);
      return set;
    },
    completeSession: async (sessionId: string, input: CompleteTrainingSessionInput) => {
      const session = await completeTrainingSession(sessionId, input);
      await Promise.all([
        mutate(`${TRAINING_SESSION_URL}/${encodeURIComponent(sessionId)}`),
        mutate(isTrainingPlanKey),
        mutate(TRAINING_HISTORY_URL),
        mutate(USER_DASHBOARD_SUMMARY_URL),
      ]);
      return session;
    },
    skipPlanDay: async (planDayId: string) => {
      const result = await skipTrainingPlanDay(planDayId);
      await Promise.all([
        mutate(isTrainingPlanKey),
        mutate(USER_DASHBOARD_SUMMARY_URL),
      ]);
      return result;
    },
  };
}
