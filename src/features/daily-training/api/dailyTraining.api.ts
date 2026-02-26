import { httpClient } from '@/lib/http/client';
import type {
  DailyTrainingCurrentResponse,
  DailyTrainingStatus,
  DailyTrainingUpsertResponse,
} from '@/features/daily-training/types/dailyTraining.types';

export function buildDailyTrainingCurrentUrl(dayDate: string): string {
  const searchParams = new URLSearchParams({ dayDate });
  return `/api/user/daily-training/current?${searchParams.toString()}`;
}

export async function getDailyTrainingCurrent(dayDate: string): Promise<DailyTrainingCurrentResponse> {
  return httpClient.get<DailyTrainingCurrentResponse>(buildDailyTrainingCurrentUrl(dayDate));
}

export async function upsertDailyTrainingCurrent(
  dayDate: string,
  status: DailyTrainingStatus,
  note?: string | null
): Promise<DailyTrainingUpsertResponse> {
  return httpClient.put<DailyTrainingUpsertResponse>('/api/user/daily-training/current', {
    dayDate,
    status,
    note: note ?? null,
  });
}
