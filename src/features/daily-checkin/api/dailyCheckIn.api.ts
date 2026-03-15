import { httpClient } from '@/lib/http/client';
import type {
  DailyCheckInCurrentResponse,
  DailyCheckInInsightsResponse,
  DailyCheckInPayload,
  DailyCheckInUpsertResponse,
} from '@/features/daily-checkin/types/dailyCheckIn.types';

export const DAILY_CHECK_IN_INSIGHTS_URL = '/api/user/daily-checkins/insights';

export function buildDailyCheckInCurrentUrl(dayDate: string): string {
  const searchParams = new URLSearchParams({ dayDate });
  return `/api/user/daily-checkins/current?${searchParams.toString()}`;
}

export async function getDailyCheckInCurrent(dayDate: string): Promise<DailyCheckInCurrentResponse> {
  return httpClient.get<DailyCheckInCurrentResponse>(buildDailyCheckInCurrentUrl(dayDate));
}

export async function upsertDailyCheckInCurrent(
  dayDate: string,
  payload: DailyCheckInPayload
): Promise<DailyCheckInUpsertResponse> {
  return httpClient.put<DailyCheckInUpsertResponse>('/api/user/daily-checkins/current', {
    dayDate,
    payload,
  });
}

export async function getDailyCheckInInsights(): Promise<DailyCheckInInsightsResponse> {
  return httpClient.get<DailyCheckInInsightsResponse>(DAILY_CHECK_IN_INSIGHTS_URL);
}
