import { httpClient } from '@/lib/http/client';
import type { Exercise, WorkoutTemplate, ClientTrainingPlan, TrainingPlanDay } from '@prisma/client';
import type { CreateExerciseInput, UpdateExerciseInput } from '@/features/training/schemas/exercise.schemas';
import type {
  CreateWorkoutTemplateInput,
  UpdateWorkoutTemplateInput,
} from '@/features/training/schemas/template.schemas';

// Exercise endpoints
export const COACH_EXERCISES_URL = '/api/admin/training/exercises';

export function buildCoachExerciseUrl(id: string) {
  return `${COACH_EXERCISES_URL}/${id}`;
}

export async function getCoachExercises(filters?: { muscleGroup?: string; equipment?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.muscleGroup) params.append('muscleGroup', filters.muscleGroup);
  if (filters?.equipment) params.append('equipment', filters.equipment);
  if (filters?.search) params.append('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';
  return httpClient.get<Exercise[]>(`${COACH_EXERCISES_URL}${query}`);
}

export async function createExercise(data: CreateExerciseInput) {
  return httpClient.post<Exercise>(COACH_EXERCISES_URL, data);
}

export async function updateExercise(id: string, data: UpdateExerciseInput) {
  return httpClient.patch<Exercise>(buildCoachExerciseUrl(id), data);
}

export async function deleteExercise(id: string) {
  return httpClient.delete<void>(buildCoachExerciseUrl(id));
}

// Template endpoints
export const COACH_TEMPLATES_URL = '/api/admin/training/templates';

export function buildCoachTemplateUrl(id: string) {
  return `${COACH_TEMPLATES_URL}/${id}`;
}

export async function getCoachTemplates() {
  return httpClient.get<WorkoutTemplate[]>(COACH_TEMPLATES_URL);
}

export async function getCoachTemplate(id: string) {
  return httpClient.get<WorkoutTemplate>(buildCoachTemplateUrl(id));
}

export async function createTemplate(data: CreateWorkoutTemplateInput) {
  return httpClient.post<WorkoutTemplate>(COACH_TEMPLATES_URL, data);
}

export async function updateTemplate(id: string, data: UpdateWorkoutTemplateInput) {
  return httpClient.patch<WorkoutTemplate>(buildCoachTemplateUrl(id), data);
}

export async function deleteTemplate(id: string) {
  return httpClient.delete<void>(buildCoachTemplateUrl(id));
}

// Plan endpoints
export const COACH_PLANS_URL = '/api/admin/training/plans';

export function buildCoachPlanUrl(id: string) {
  return `${COACH_PLANS_URL}/${id}`;
}

export function buildCoachPlanDaysUrl(planId: string) {
  return `${buildCoachPlanUrl(planId)}/days`;
}

export function buildCoachPlanDayUrl(planId: string, dayId: string) {
  return `${buildCoachPlanDaysUrl(planId)}/${dayId}`;
}

export async function getCoachPlans() {
  return httpClient.get<ClientTrainingPlan[]>(COACH_PLANS_URL);
}

export async function getCoachPlan(id: string) {
  return httpClient.get<ClientTrainingPlan>(buildCoachPlanUrl(id));
}

export async function createPlan(data: { name: string; clientId: string; startDate: string; endDate: string }) {
  return httpClient.post<ClientTrainingPlan>(COACH_PLANS_URL, data);
}

export async function updatePlan(
  id: string,
  data: {
    name?: string;
    status?: string;
    endDate?: string;
  },
) {
  return httpClient.patch<ClientTrainingPlan>(buildCoachPlanUrl(id), data);
}

// Plan days endpoints
export async function createPlanDay(
  planId: string,
  data: {
    date: string;
    type: string;
    workoutTemplateId?: string | null;
    title?: string | null;
    note?: string | null;
  },
) {
  return httpClient.post<TrainingPlanDay>(buildCoachPlanDaysUrl(planId), data);
}

export async function bulkCreatePlanDays(
  planId: string,
  data: {
    days: Array<{ date: string; type: string; workoutTemplateId?: string | null }>;
  },
) {
  return httpClient.post<TrainingPlanDay[]>(buildCoachPlanDaysUrl(planId), data);
}

export async function updatePlanDay(
  planId: string,
  dayId: string,
  data: {
    type?: string;
    workoutTemplateId?: string | null;
    title?: string | null;
    note?: string | null;
    status?: string;
  },
) {
  return httpClient.patch<TrainingPlanDay>(buildCoachPlanDayUrl(planId, dayId), data);
}

export async function deletePlanDay(planId: string, dayId: string) {
  return httpClient.delete<void>(buildCoachPlanDayUrl(planId, dayId));
}
