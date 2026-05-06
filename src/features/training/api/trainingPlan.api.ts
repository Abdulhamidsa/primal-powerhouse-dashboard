import { httpClient } from '@/lib/http/client';
import type { TrainingPlanDTO, TrainingPlanDayLookupDTO } from '@/features/training/types/clientTraining.types';

export const TRAINING_PLAN_URL = '/api/user/training/plan';

export function buildTrainingPlanDayUrl(dateKey: string) {
  return `${TRAINING_PLAN_URL}/${encodeURIComponent(dateKey)}`;
}

export async function getTrainingPlan() {
  return httpClient.get<TrainingPlanDTO>(TRAINING_PLAN_URL);
}

export async function getTrainingPlanDay(dateKey: string) {
  return httpClient.get<TrainingPlanDayLookupDTO>(buildTrainingPlanDayUrl(dateKey));
}
