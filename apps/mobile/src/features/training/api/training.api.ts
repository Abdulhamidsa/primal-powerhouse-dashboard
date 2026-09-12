import { ApiError, httpClient } from '@/lib/http/client';
import type { TrainingPlan, TrainingSession, WorkoutAssignment, AssignedVideo } from '../types/training.types';
import { assignedVideoDetailSchema } from '../schemas/training.schema';
export async function getPlan() {
  try {
    return await httpClient.get<TrainingPlan>('/api/user/training/plan');
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
export const getAssignments = () => httpClient.get<WorkoutAssignment[]>('/api/user/workout-assignments');
export const getVideos = () => httpClient.get<AssignedVideo[]>('/api/user/videos');
export const getVideo = async (id: string) =>
  assignedVideoDetailSchema.parse(
    await httpClient.get(`/api/user/videos/${encodeURIComponent(id)}`),
  );
export const completeVideo = (id: string) =>
  httpClient.send(`/api/user/videos/${encodeURIComponent(id)}/complete`, 'POST');
export const startTraining = (payload: unknown) =>
  httpClient.send<TrainingSession>('/api/user/training/sessions', 'POST', payload);
export const getSession = (id: string) =>
  httpClient.get<TrainingSession>(`/api/user/training/sessions/${encodeURIComponent(id)}`);
export const saveSet = (session: string, set: string, payload: unknown) =>
  httpClient.send(
    `/api/user/training/sessions/${encodeURIComponent(session)}/sets/${encodeURIComponent(set)}`,
    'PATCH',
    payload,
  );
export const finishTraining = (session: string, payload: unknown) =>
  httpClient.send(`/api/user/training/sessions/${encodeURIComponent(session)}`, 'PATCH', payload);
export const skipDay = (day: string) =>
  httpClient.send(`/api/user/training/plan/${encodeURIComponent(day)}/skip`, 'POST');
export const getHistory = () => httpClient.get<TrainingSession[]>('/api/user/training/history');
export const startWorkout = (planAssignmentId: string, restart = false) =>
  httpClient.send<{ id: string; status: string }>('/api/user/workout-sessions', 'POST', {
    planAssignmentId,
    restart,
    resume: true,
  });
export const finishWorkout = (session: string, payload: unknown) =>
  httpClient.send(`/api/user/workout-sessions/${encodeURIComponent(session)}`, 'PATCH', payload);
