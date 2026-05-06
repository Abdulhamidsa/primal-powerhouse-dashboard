import { httpClient } from '@/lib/http/client';
import type {
  UpdateSetInput,
  StartTrainingSessionInput,
  CompleteTrainingSessionInput,
} from '@/features/training/schemas/session.schemas';
import type {
  TrainingHistoryDTO,
  TrainingPreviousPerformanceDTO,
  TrainingSessionDTO,
  TrainingSessionSetDTO,
} from '@/features/training/types/clientTraining.types';

export const TRAINING_SESSION_URL = '/api/user/training/sessions';
export const TRAINING_HISTORY_URL = '/api/user/training/history';

export function buildTrainingSessionUrl(sessionId: string) {
  return `${TRAINING_SESSION_URL}/${encodeURIComponent(sessionId)}`;
}

export function buildTrainingSessionSetUrl(sessionId: string, setId: string) {
  return `${TRAINING_SESSION_URL}/${encodeURIComponent(sessionId)}/sets/${encodeURIComponent(setId)}`;
}

export function buildTrainingPreviousPerformanceUrl(exerciseId: string) {
  return `/api/user/training/performance/${encodeURIComponent(exerciseId)}`;
}

export function buildTrainingSkipPlanDayUrl(planDayId: string) {
  return `/api/user/training/plan/${encodeURIComponent(planDayId)}/skip`;
}

export async function startTrainingSession(payload: StartTrainingSessionInput) {
  return httpClient.post<TrainingSessionDTO>(TRAINING_SESSION_URL, payload);
}

export async function getTrainingSession(sessionId: string) {
  return httpClient.get<TrainingSessionDTO>(buildTrainingSessionUrl(sessionId));
}

export async function updateTrainingSessionSet(sessionId: string, setId: string, payload: UpdateSetInput) {
  return httpClient.patch<TrainingSessionSetDTO>(buildTrainingSessionSetUrl(sessionId, setId), payload);
}

export async function completeTrainingSession(sessionId: string, payload: CompleteTrainingSessionInput) {
  return httpClient.patch<TrainingSessionDTO>(buildTrainingSessionUrl(sessionId), payload);
}

export async function getTrainingPreviousPerformance(exerciseId: string) {
  return httpClient.get<TrainingPreviousPerformanceDTO>(buildTrainingPreviousPerformanceUrl(exerciseId));
}

export async function skipTrainingPlanDay(planDayId: string) {
  return httpClient.post<{ id: string; status: string }>(buildTrainingSkipPlanDayUrl(planDayId));
}

export async function getTrainingHistory(limit = 10) {
  const params = new URLSearchParams({ limit: String(limit) });
  return httpClient.get<TrainingHistoryDTO>(`${TRAINING_HISTORY_URL}?${params.toString()}`);
}
