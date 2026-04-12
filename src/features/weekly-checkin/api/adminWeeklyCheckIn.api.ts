import { httpClient } from '@/lib/http/client';
import type {
  AdminClientWeeklyCheckInsResponse,
  AdminClientWeeklyCheckInStatusesResponse,
} from '@/features/weekly-checkin/types/adminWeeklyCheckIn.types';

export async function getAdminClientWeeklyCheckIns(clientId: string): Promise<AdminClientWeeklyCheckInsResponse> {
  return httpClient.get<AdminClientWeeklyCheckInsResponse>(
    `/api/admin/clients/${encodeURIComponent(clientId)}/weekly-checkins`
  );
}

export async function deleteAdminClientWeeklyCheckIn(
  clientId: string,
  checkInId: string
): Promise<{ success: boolean }> {
  return httpClient.delete<{ success: boolean }>(
    `/api/admin/clients/${encodeURIComponent(clientId)}/weekly-checkins/${encodeURIComponent(checkInId)}`
  );
}

export async function resetAdminClientWeeklyCheckIns(
  clientId: string,
  confirmText: string
): Promise<{ success: boolean; deletedCount: number }> {
  return httpClient.post<{ success: boolean; deletedCount: number }>(
    `/api/admin/clients/${encodeURIComponent(clientId)}/weekly-checkins/reset`,
    { confirmText }
  );
}

export async function getAdminClientWeeklyCheckInStatuses(
  clientIds: string[]
): Promise<AdminClientWeeklyCheckInStatusesResponse> {
  if (!clientIds.length) {
    return { statuses: {} };
  }

  const searchParams = new URLSearchParams({ clientIds: clientIds.join(',') });
  return httpClient.get<AdminClientWeeklyCheckInStatusesResponse>(
    `/api/admin/clients/weekly-checkins/statuses?${searchParams.toString()}`
  );
}

export async function markAdminWeeklyCheckInReviewed(
  clientId: string,
  checkInId: string
): Promise<{ success: boolean }> {
  return httpClient.post<{ success: boolean }>(
    `/api/admin/clients/${encodeURIComponent(clientId)}/weekly-checkins/${encodeURIComponent(checkInId)}/review`,
    {}
  );
}
