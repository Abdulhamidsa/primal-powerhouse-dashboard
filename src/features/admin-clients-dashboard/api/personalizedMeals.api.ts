import { httpClient } from '@/lib/http/client';
import type { AdminPersonalizedMealsResponse } from '@/features/admin-clients-dashboard/types/personalizedMeal.types';

export function buildAdminPersonalizedMealsUrl(clientId: string): string {
  return `/api/clients/${encodeURIComponent(clientId)}/meals`;
}

export function getAdminPersonalizedMeals(clientId: string): Promise<AdminPersonalizedMealsResponse> {
  return httpClient.get<AdminPersonalizedMealsResponse>(buildAdminPersonalizedMealsUrl(clientId));
}
