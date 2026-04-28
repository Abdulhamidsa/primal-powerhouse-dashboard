import { httpClient } from '@/lib/http/client';
import type { AdminClientDailyCheckInsResponse } from '@/features/daily-checkin/types/adminDailyCheckIn.types';

export function buildAdminClientDailyCheckInsUrl(clientId: string): string {
  return `/api/admin/clients/${encodeURIComponent(clientId)}/daily-checkins`;
}

export async function getAdminClientDailyCheckIns(clientId: string): Promise<AdminClientDailyCheckInsResponse> {
  return httpClient.get<AdminClientDailyCheckInsResponse>(buildAdminClientDailyCheckInsUrl(clientId));
}

export async function markAdminDailyCheckInReviewed(
  clientId: string,
  checkInId: string,
): Promise<{ success: boolean }> {
  return httpClient.post<{ success: boolean }>(
    `/api/admin/clients/${encodeURIComponent(clientId)}/daily-checkins/${encodeURIComponent(checkInId)}/review`,
    {},
  );
}
