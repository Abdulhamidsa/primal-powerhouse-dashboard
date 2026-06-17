import { httpClient } from '@/lib/http/client';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';

export const USER_DASHBOARD_SUMMARY_URL = '/api/user/dashboard/summary';

export async function getUserDashboardSummary(): Promise<UserDashboardSummary> {
  return httpClient.get<UserDashboardSummary>(USER_DASHBOARD_SUMMARY_URL);
}
