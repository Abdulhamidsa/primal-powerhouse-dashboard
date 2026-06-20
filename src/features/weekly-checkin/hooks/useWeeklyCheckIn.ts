'use client';

import useSWR, { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/fetcher';
import {
  buildWeeklyCheckInCurrentUrl,
  getWeeklyCheckInCurrent,
  upsertWeeklyCheckIn,
} from '@/features/weekly-checkin/api/weeklyCheckIn.api';
import { USER_DASHBOARD_SUMMARY_URL } from '@/features/user-dashboard/api/userDashboard.api';
import type {
  WeeklyCheckInCurrentResponse,
  WeeklyCheckInPayload,
} from '@/features/weekly-checkin/types/weeklyCheckIn.types';
import { getCurrentWeekStartDateKey, getWeeklyCheckInStatus } from '@/features/weekly-checkin/utils/week';

export function useWeeklyCheckInCurrentWeek() {
  const weekStartDate = getCurrentWeekStartDateKey();
  const key = buildWeeklyCheckInCurrentUrl(weekStartDate);

  const { data, error, isLoading, isValidating, mutate } = useSWR<WeeklyCheckInCurrentResponse, ApiError>(key, () =>
    getWeeklyCheckInCurrent(weekStartDate)
  );

  return {
    weekStartDate,
    checkIn: data?.checkIn ?? null,
    status: getWeeklyCheckInStatus(Boolean(data?.checkIn)),
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useUpsertWeeklyCheckIn() {
  const { mutate } = useSWRConfig();

  const submit = async (weekStartDate: string, payload: WeeklyCheckInPayload) => {
    const result = await upsertWeeklyCheckIn(weekStartDate, payload);
    await Promise.all([mutate(buildWeeklyCheckInCurrentUrl(weekStartDate)), mutate(USER_DASHBOARD_SUMMARY_URL)]);
    return result;
  };

  return { submit };
}
