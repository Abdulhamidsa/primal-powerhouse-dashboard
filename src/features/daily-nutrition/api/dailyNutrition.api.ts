import { httpClient } from '@/lib/http/client';
import type {
  DailyNutritionCurrentResponse,
  DailyNutritionStatus,
  DailyNutritionUpsertResponse,
} from '@/features/daily-nutrition/types/dailyNutrition.types';

export function buildDailyNutritionCurrentUrl(dayDate: string): string {
  const searchParams = new URLSearchParams({ dayDate });
  return `/api/user/daily-nutrition/current?${searchParams.toString()}`;
}

export async function getDailyNutritionCurrent(dayDate: string): Promise<DailyNutritionCurrentResponse> {
  return httpClient.get<DailyNutritionCurrentResponse>(buildDailyNutritionCurrentUrl(dayDate));
}

export async function upsertDailyNutritionCurrent(
  dayDate: string,
  status: DailyNutritionStatus,
  note?: string | null
): Promise<DailyNutritionUpsertResponse> {
  return httpClient.put<DailyNutritionUpsertResponse>('/api/user/daily-nutrition/current', {
    dayDate,
    status,
    note: note ?? null,
  });
}
