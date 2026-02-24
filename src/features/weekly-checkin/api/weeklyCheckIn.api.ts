import { httpClient } from '@/lib/http/client';
import type {
  WeeklyCheckInCurrentResponse,
  WeeklyCheckInPayload,
  WeeklyCheckInUpsertResponse,
} from '@/features/weekly-checkin/types/weeklyCheckIn.types';

export function buildWeeklyCheckInCurrentUrl(weekStartDate: string): string {
  const searchParams = new URLSearchParams({ weekStartDate });
  return `/api/user/weekly-checkins/current?${searchParams.toString()}`;
}

export async function getWeeklyCheckInCurrent(weekStartDate: string): Promise<WeeklyCheckInCurrentResponse> {
  return httpClient.get<WeeklyCheckInCurrentResponse>(buildWeeklyCheckInCurrentUrl(weekStartDate));
}

export async function upsertWeeklyCheckIn(
  weekStartDate: string,
  payload: WeeklyCheckInPayload
): Promise<WeeklyCheckInUpsertResponse> {
  return httpClient.put<WeeklyCheckInUpsertResponse>('/api/user/weekly-checkins/current', {
    weekStartDate,
    payload,
  });
}
