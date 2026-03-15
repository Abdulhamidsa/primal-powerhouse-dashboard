'use client';

import useSWR, { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/request';
import {
  buildDailyCheckInCurrentUrl,
  DAILY_CHECK_IN_INSIGHTS_URL,
  getDailyCheckInCurrent,
  getDailyCheckInInsights,
  upsertDailyCheckInCurrent,
} from '@/features/daily-checkin/api/dailyCheckIn.api';
import type {
  DailyCheckInCurrentResponse,
  DailyCheckInInsightsResponse,
  DailyCheckInPayload,
} from '@/features/daily-checkin/types/dailyCheckIn.types';
import { getTodayDateKeyLocal } from '@/features/daily-checkin/utils/date';

export function useDailyCheckInToday() {
  const dayDate = getTodayDateKeyLocal();
  const key = buildDailyCheckInCurrentUrl(dayDate);

  const { data, error, isLoading, isValidating, mutate } = useSWR<DailyCheckInCurrentResponse, ApiError>(key, () =>
    getDailyCheckInCurrent(dayDate)
  );

  return {
    dayDate,
    entry: data?.entry ?? null,
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useDailyCheckInInsights() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<DailyCheckInInsightsResponse, ApiError>(
    DAILY_CHECK_IN_INSIGHTS_URL,
    getDailyCheckInInsights
  );

  return {
    summary: data?.summary ?? null,
    history: data?.history ?? [],
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useUpsertDailyCheckIn() {
  const { mutate } = useSWRConfig();

  const submit = async (dayDate: string, payload: DailyCheckInPayload) => {
    const result = await upsertDailyCheckInCurrent(dayDate, payload);

    await Promise.all([mutate(buildDailyCheckInCurrentUrl(dayDate)), mutate(DAILY_CHECK_IN_INSIGHTS_URL)]);

    return result;
  };

  return { submit };
}
