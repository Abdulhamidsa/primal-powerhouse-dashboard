'use client';

import useSWR, { useSWRConfig } from 'swr';
import {
  getAdminClientWorkoutSessions,
  getAdminClientWorkoutSession,
  markAdminWorkoutSessionReviewed,
} from '@/features/workout-session/api/adminWorkoutSession.api';
import type {
  AdminWorkoutSessionListResponse,
  AdminWorkoutSessionDetail,
} from '@/features/workout-session/types/adminWorkoutSession.types';
import type { ApiError } from '@/lib/fetcher';

function buildAdminClientWorkoutSessionsKey(clientId: string) {
  return `/api/admin/clients/${encodeURIComponent(clientId)}/workout-sessions`;
}

function buildAdminClientWorkoutSessionKey(clientId: string, sessionId: string) {
  return `/api/admin/clients/${encodeURIComponent(clientId)}/workout-sessions/${encodeURIComponent(sessionId)}`;
}

export function useAdminClientWorkoutSessions(clientId: string) {
  const key = clientId ? buildAdminClientWorkoutSessionsKey(clientId) : null;

  const { data, error, isLoading, mutate, isValidating } = useSWR<AdminWorkoutSessionListResponse, ApiError>(key, () =>
    getAdminClientWorkoutSessions(clientId),
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useAdminWorkoutSession(clientId: string, sessionId?: string | null) {
  const key = clientId && sessionId ? buildAdminClientWorkoutSessionKey(clientId, sessionId) : null;

  const { data, error, isLoading, mutate } = useSWR<AdminWorkoutSessionDetail, ApiError>(key, () =>
    getAdminClientWorkoutSession(clientId, sessionId ?? ''),
  );

  return {
    data,
    error,
    isLoading,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useAdminWorkoutSessionActions(clientId: string) {
  const { mutate } = useSWRConfig();

  const refreshRelated = async () => {
    await mutate(buildAdminClientWorkoutSessionsKey(clientId));
    await mutate((key: unknown) =>
      typeof key === 'string' && key.startsWith(`/api/admin/clients/${encodeURIComponent(clientId)}/workout-sessions/`),
    );
  };

  const markReviewed = async (sessionId: string) => {
    const result = await markAdminWorkoutSessionReviewed(clientId, sessionId);
    await refreshRelated();
    return result;
  };

  return {
    markReviewed,
  };
}
