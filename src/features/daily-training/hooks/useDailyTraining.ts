'use client';

import useSWR, { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/request';
import {
  buildDailyTrainingCurrentUrl,
  getDailyTrainingCurrent,
  upsertDailyTrainingCurrent,
} from '@/features/daily-training/api/dailyTraining.api';
import {
  buildDailyCheckInCurrentUrl,
  DAILY_CHECK_IN_INSIGHTS_URL,
} from '@/features/daily-checkin/api/dailyCheckIn.api';
import { USER_DASHBOARD_SUMMARY_URL } from '@/features/user-dashboard/api/userDashboard.api';
import type { DailyTrainingStatus } from '@/features/daily-training/types/dailyTraining.types';

function getTodayDateKeyLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useDailyTrainingToday() {
  const dayDate = getTodayDateKeyLocal();
  const key = buildDailyTrainingCurrentUrl(dayDate);

  const { data, error, isLoading, isValidating, mutate } = useSWR(key, () => getDailyTrainingCurrent(dayDate));

  return {
    dayDate,
    entry: data?.entry ?? null,
    isLoading,
    isValidating,
    error: error as ApiError | undefined,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useUpsertDailyTraining() {
  const { mutate } = useSWRConfig();

  const submit = async (dayDate: string, status: DailyTrainingStatus, note?: string | null) => {
    const result = await upsertDailyTrainingCurrent(dayDate, status, note);
    await Promise.all([
      mutate(buildDailyTrainingCurrentUrl(dayDate)),
      mutate(buildDailyCheckInCurrentUrl(dayDate)),
      mutate(DAILY_CHECK_IN_INSIGHTS_URL),
      mutate(USER_DASHBOARD_SUMMARY_URL),
    ]);
    return result;
  };

  return { submit };
}
