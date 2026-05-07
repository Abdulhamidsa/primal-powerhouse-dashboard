import { httpClient } from '@/lib/http/client';
import type {
  AdminWorkoutSessionListResponse,
  AdminWorkoutSessionDetail,
} from '@/features/workout-session/types/adminWorkoutSession.types';

export async function getAdminClientWorkoutSessions(clientId: string): Promise<AdminWorkoutSessionListResponse> {
  return httpClient.get<AdminWorkoutSessionListResponse>(
    `/api/admin/clients/${encodeURIComponent(clientId)}/workout-sessions`,
  );
}

export async function getAdminClientWorkoutSession(
  clientId: string,
  sessionId: string,
): Promise<AdminWorkoutSessionDetail> {
  return httpClient.get<AdminWorkoutSessionDetail>(
    `/api/admin/clients/${encodeURIComponent(clientId)}/workout-sessions/${encodeURIComponent(sessionId)}`,
  );
}

export async function markAdminWorkoutSessionReviewed(
  clientId: string,
  sessionId: string,
): Promise<{ success: boolean }> {
  return httpClient.post<{ success: boolean }>(
    `/api/admin/clients/${encodeURIComponent(clientId)}/workout-sessions/${encodeURIComponent(sessionId)}/review`,
    {},
  );
}
