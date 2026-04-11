'use client';

import useSWR, { useSWRConfig } from 'swr';
import {
  getWorkoutPlans,
  getWorkoutPlan,
  createWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  getClientWorkoutAssignments,
  assignWorkoutPlan,
  patchWorkoutAssignment,
  deleteWorkoutAssignment,
} from '../api/workoutPlan.api';
import type { CreateWorkoutPlanInput, UpdateWorkoutPlanInput } from '../schemas/workoutPlan.schemas';

export function useWorkoutPlans() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/workout-plans', getWorkoutPlans, {
    revalidateOnFocus: false,
  });

  return { plans: data ?? [], error, isLoading, mutate };
}

export function useWorkoutPlan(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/admin/workout-plans/${id}` : null,
    () => getWorkoutPlan(id!),
    { revalidateOnFocus: false },
  );

  return { plan: data ?? null, error, isLoading, mutate };
}

export function useClientWorkoutAssignments(clientId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    clientId ? `/api/admin/workout-plans/assignments?clientId=${clientId}` : null,
    () => getClientWorkoutAssignments(clientId!),
    { revalidateOnFocus: false },
  );

  return { assignments: data ?? [], error, isLoading, mutate };
}

export function useWorkoutPlanActions() {
  const { mutate } = useSWRConfig();

  async function create(data: CreateWorkoutPlanInput) {
    const plan = await createWorkoutPlan(data);
    await mutate('/api/admin/workout-plans');
    return plan;
  }

  async function update(id: string, data: UpdateWorkoutPlanInput) {
    const plan = await updateWorkoutPlan(id, data);
    await mutate('/api/admin/workout-plans');
    await mutate(`/api/admin/workout-plans/${id}`);
    return plan;
  }

  async function remove(id: string) {
    await deleteWorkoutPlan(id);
    await mutate('/api/admin/workout-plans');
  }

  async function assign(data: { workoutPlanId: string; clientId: string; isActive?: boolean }) {
    const assignment = await assignWorkoutPlan(data);
    await mutate(`/api/admin/workout-plans/assignments?clientId=${data.clientId}`);
    return assignment;
  }

  async function setAssignmentActive(assignmentId: string, clientId: string, isActive: boolean) {
    const updated = await patchWorkoutAssignment(assignmentId, { isActive });
    await mutate(`/api/admin/workout-plans/assignments?clientId=${clientId}`);
    return updated;
  }

  async function removeAssignment(assignmentId: string, clientId: string) {
    await deleteWorkoutAssignment(assignmentId);
    await mutate(`/api/admin/workout-plans/assignments?clientId=${clientId}`);
  }

  return { create, update, remove, assign, setAssignmentActive, removeAssignment };
}
