import { httpClient } from '@/lib/http/client';
import type { WorkoutSession } from '../types/workoutSession.types';
import type { CompleteSessionPayload } from '../schemas/workoutSession.schemas';

export async function startWorkoutSession(planAssignmentId: string): Promise<WorkoutSession> {
  return httpClient.post<WorkoutSession>('/api/user/workout-sessions', { planAssignmentId });
}

export async function completeWorkoutSession(
  sessionId: string,
  payload: CompleteSessionPayload,
): Promise<{ ok: boolean }> {
  return httpClient.patch<{ ok: boolean }>(`/api/user/workout-sessions/${encodeURIComponent(sessionId)}`, payload);
}
