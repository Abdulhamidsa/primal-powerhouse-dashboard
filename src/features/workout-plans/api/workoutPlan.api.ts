import { httpClient } from '@/lib/http/client';
import type { WorkoutPlan, WorkoutPlanAssignment, WorkoutPlanAssignmentWithPlan } from '../types/workoutPlan.types';
import type { CreateWorkoutPlanInput, UpdateWorkoutPlanInput } from '../schemas/workoutPlan.schemas';

// Coach/admin endpoints
export async function getWorkoutPlans(): Promise<WorkoutPlan[]> {
  return httpClient.get<WorkoutPlan[]>('/api/admin/workout-plans');
}

export async function getWorkoutPlan(id: string): Promise<WorkoutPlan> {
  return httpClient.get<WorkoutPlan>(`/api/admin/workout-plans/${encodeURIComponent(id)}`);
}

export async function createWorkoutPlan(data: CreateWorkoutPlanInput): Promise<WorkoutPlan> {
  return httpClient.post<WorkoutPlan>('/api/admin/workout-plans', data);
}

export async function updateWorkoutPlan(id: string, data: UpdateWorkoutPlanInput): Promise<WorkoutPlan> {
  return httpClient.patch<WorkoutPlan>(`/api/admin/workout-plans/${encodeURIComponent(id)}`, data);
}

export async function deleteWorkoutPlan(id: string): Promise<void> {
  return httpClient.delete(`/api/admin/workout-plans/${encodeURIComponent(id)}`);
}

export async function getClientWorkoutAssignments(clientId: string): Promise<WorkoutPlanAssignmentWithPlan[]> {
  return httpClient.get<WorkoutPlanAssignmentWithPlan[]>(
    `/api/admin/workout-plans/assignments?clientId=${encodeURIComponent(clientId)}`,
  );
}

export async function assignWorkoutPlan(data: {
  workoutPlanId: string;
  clientId: string;
  isActive?: boolean;
}): Promise<WorkoutPlanAssignment> {
  return httpClient.post<WorkoutPlanAssignment>('/api/admin/workout-plans/assignments', data);
}

export async function patchWorkoutAssignment(
  assignmentId: string,
  data: { isActive: boolean },
): Promise<WorkoutPlanAssignment> {
  return httpClient.patch<WorkoutPlanAssignment>(
    `/api/admin/workout-plans/assignments/${encodeURIComponent(assignmentId)}`,
    data,
  );
}

export async function deleteWorkoutAssignment(assignmentId: string): Promise<void> {
  return httpClient.delete(`/api/admin/workout-plans/assignments/${encodeURIComponent(assignmentId)}`);
}

// Client endpoint
export async function getUserWorkoutAssignments(): Promise<WorkoutPlanAssignmentWithPlan[]> {
  return httpClient.get<WorkoutPlanAssignmentWithPlan[]>('/api/user/workout-assignments');
}
