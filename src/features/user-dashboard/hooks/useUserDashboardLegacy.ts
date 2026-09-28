'use client';

import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import {
  completeUserDashboardVideo,
  getUserDashboardMeals,
  getUserDashboardVideos,
  USER_DASHBOARD_MEALS_URL,
  USER_DASHBOARD_VIDEOS_URL,
} from '@/features/user-dashboard/api/userDashboardLegacy.api';
import type {
  UserDashboardMealPlan,
  UserDashboardVideoAssignment,
} from '@/features/user-dashboard/types/userDashboardLegacy.types';

export function useUserDashboardMeals(enabled: boolean) {
  const { data, error, isLoading } = useSWR<UserDashboardMealPlan[], ApiError>(
    enabled ? USER_DASHBOARD_MEALS_URL : null,
    getUserDashboardMeals,
  );

  return { mealPlans: data ?? [], error, isLoading };
}

export function useUserDashboardVideos(enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR<UserDashboardVideoAssignment[], ApiError>(
    enabled ? USER_DASHBOARD_VIDEOS_URL : null,
    getUserDashboardVideos,
  );

  return {
    videoAssignments: data ?? [],
    error,
    isLoading,
    complete: async (assignmentId: string) => {
      await completeUserDashboardVideo(assignmentId);
      await mutate(current => current?.map(assignment => assignment.id === assignmentId
        ? { ...assignment, isCompleted: true, completedAt: new Date().toISOString(), progress: 100 }
        : assignment));
    },
  };
}
