import { httpClient } from '@/lib/http/client';
import type { AdminClientMealPlan } from '@/features/admin-clients-dashboard/types/adminClientMealPlan.types';

export function buildAdminClientMealPlansUrl(clientId: string): string {
  return `/api/clients/${encodeURIComponent(clientId)}/meal-plans`;
}

export function getAdminClientMealPlans(clientId: string): Promise<AdminClientMealPlan[]> {
  return httpClient.get<AdminClientMealPlan[]>(buildAdminClientMealPlansUrl(clientId));
}
