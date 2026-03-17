import { httpClient } from '@/lib/http/client';
import type { AdminCommandCenterResponse } from '@/features/admin-command-center/types/adminCommandCenter.types';

export function buildAdminCommandCenterUrl(): string {
  return '/api/admin/command-center';
}

export function buildWeeklyCheckInReviewUrl(clientId: string, checkInId: string): string {
  return `/api/admin/clients/${encodeURIComponent(clientId)}/weekly-checkins/${encodeURIComponent(checkInId)}/review`;
}

export async function getAdminCommandCenter(): Promise<AdminCommandCenterResponse> {
  return httpClient.get<AdminCommandCenterResponse>(buildAdminCommandCenterUrl());
}

export async function markWeeklyCheckInReviewed(clientId: string, checkInId: string): Promise<{ success: true }> {
  return httpClient.post<{ success: true }>(buildWeeklyCheckInReviewUrl(clientId, checkInId));
}
