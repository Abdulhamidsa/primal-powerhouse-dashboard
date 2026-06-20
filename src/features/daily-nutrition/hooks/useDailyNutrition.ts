'use client';

import useSWR, { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/request';
import {
  buildDailyNutritionCurrentUrl,
  getDailyNutritionCurrent,
  upsertDailyNutritionCurrent,
} from '@/features/daily-nutrition/api/dailyNutrition.api';
import {
  buildDailyCheckInCurrentUrl,
  DAILY_CHECK_IN_INSIGHTS_URL,
} from '@/features/daily-checkin/api/dailyCheckIn.api';
import { USER_DASHBOARD_SUMMARY_URL } from '@/features/user-dashboard/api/userDashboard.api';
import type { DailyNutritionStatus } from '@/features/daily-nutrition/types/dailyNutrition.types';

function getTodayDateKeyLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useDailyNutritionToday() {
  const dayDate = getTodayDateKeyLocal();
  const key = buildDailyNutritionCurrentUrl(dayDate);

  const { data, error, isLoading, isValidating, mutate } = useSWR(key, () => getDailyNutritionCurrent(dayDate));

  return {
    dayDate,
    entry: data?.entry ?? null,
    isLoading,
    isValidating,
    error: error as ApiError | undefined,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useUpsertDailyNutrition() {
  const { mutate } = useSWRConfig();

  const submit = async (dayDate: string, status: DailyNutritionStatus, note?: string | null) => {
    const nutritionKey = buildDailyNutritionCurrentUrl(dayDate);
    const checkInKey = buildDailyCheckInCurrentUrl(dayDate);

    const result = await mutate(
      nutritionKey,
      async (currentData: any) => {
        const serverResult = await upsertDailyNutritionCurrent(dayDate, status, note);
        return {
          ...currentData,
          entry: {
            ...currentData?.entry,
            ...serverResult.entry,
          },
        };
      },
      {
        optimisticData: (currentData: any) => ({
          ...currentData,
          entry: {
            ...currentData?.entry,
            status,
            note: note ?? currentData?.entry?.note ?? null,
          },
        }),
        rollbackOnError: true,
        revalidate: false,
        populateCache: true,
      }
    );

    await Promise.all([
      mutate(checkInKey),
      mutate(DAILY_CHECK_IN_INSIGHTS_URL),
      mutate(USER_DASHBOARD_SUMMARY_URL),
    ]);

    return result;
  };

  return { submit };
}
