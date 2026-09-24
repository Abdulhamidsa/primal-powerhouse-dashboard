import { httpClient } from '@/lib/http/client';
import type { TrainingCoachResponse, TrainingVideoAssignment } from '@/features/training/types/userTraining.types';

export const USER_TRAINING_VIDEOS_URL = '/api/user/videos';
export const USER_TRAINING_COACH_URL = '/api/user/coach';

export async function getUserTrainingVideos() {
  return httpClient.get<TrainingVideoAssignment[]>(USER_TRAINING_VIDEOS_URL);
}

export async function getUserTrainingVideoAssignment(assignmentId: string) {
  return httpClient.get<TrainingVideoAssignment>(`${USER_TRAINING_VIDEOS_URL}/${encodeURIComponent(assignmentId)}`);
}

export async function getUserTrainingCoach() {
  return httpClient.get<TrainingCoachResponse>(USER_TRAINING_COACH_URL);
}
