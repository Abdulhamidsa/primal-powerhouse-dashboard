import { httpClient } from '@/lib/http/client';
import type { ClientNutritionComparisonResponse } from '@/features/client-nutrition-comparison/types/clientNutritionComparison.types';

export function buildClientNutritionComparisonUrl(clientId: string): string {
  return `/api/admin/clients/${encodeURIComponent(clientId)}/nutrition-comparison`;
}

export async function getClientNutritionComparison(clientId: string): Promise<ClientNutritionComparisonResponse> {
  return httpClient.get<ClientNutritionComparisonResponse>(buildClientNutritionComparisonUrl(clientId));
}
