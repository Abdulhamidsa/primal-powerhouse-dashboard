import { httpClient } from '@/lib/http/client';
import type {
  UserDashboardMealPlan,
  UserDashboardVideoAssignment,
} from '@/features/user-dashboard/types/userDashboardLegacy.types';

export const USER_DASHBOARD_MEALS_URL = '/api/user-dashboard/meals';
export const USER_DASHBOARD_VIDEOS_URL = '/api/user-dashboard/videos';

export function getUserDashboardMeals(): Promise<UserDashboardMealPlan[]> {
  return httpClient.get<UserDashboardMealPlan[]>(USER_DASHBOARD_MEALS_URL);
}

export function getUserDashboardVideos(): Promise<UserDashboardVideoAssignment[]> {
  return httpClient.get<UserDashboardVideoAssignment[]>(USER_DASHBOARD_VIDEOS_URL);
}

export function completeUserDashboardVideo(assignmentId: string): Promise<unknown> {
  return httpClient.post(`${USER_DASHBOARD_VIDEOS_URL}/${encodeURIComponent(assignmentId)}/complete`);
}
