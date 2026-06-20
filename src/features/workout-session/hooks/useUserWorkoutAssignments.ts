'use client';

import useSWR from 'swr';
import { getUserWorkoutAssignments } from '@/features/workout-plans/api/workoutPlan.api';
import type { WorkoutPlanAssignmentWithPlan } from '@/features/workout-plans/types/workoutPlan.types';

export function useUserWorkoutAssignments() {
  const { data, error, isLoading, mutate } = useSWR<WorkoutPlanAssignmentWithPlan[]>(
    '/api/user/workout-assignments',
    getUserWorkoutAssignments,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  return { assignments: data ?? [], error, isLoading, mutate };
}
