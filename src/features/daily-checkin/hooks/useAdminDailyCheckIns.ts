'use client';

import useSWR, { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/fetcher';
import {
  buildAdminClientDailyCheckInsUrl,
  getAdminClientDailyCheckIns,
  markAdminDailyCheckInReviewed,
} from '@/features/daily-checkin/api/adminDailyCheckIn.api';
import type { AdminClientDailyCheckInsResponse } from '@/features/daily-checkin/types/adminDailyCheckIn.types';

function buildDailyCheckInsKey(clientId: string): string {
  return buildAdminClientDailyCheckInsUrl(clientId);
}

export function useAdminClientDailyCheckIns(clientId: string) {
  const key = clientId ? buildDailyCheckInsKey(clientId) : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<AdminClientDailyCheckInsResponse, ApiError>(key, () =>
    getAdminClientDailyCheckIns(clientId),
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useAdminDailyCheckInActions(clientId: string) {
  const { mutate } = useSWRConfig();

  const refreshRelated = async () => {
    await mutate(buildDailyCheckInsKey(clientId));
  };

  const markReviewed = async (checkInId: string) => {
    await markAdminDailyCheckInReviewed(clientId, checkInId);
    await refreshRelated();
  };

  return {
    markReviewed,
  };
}
