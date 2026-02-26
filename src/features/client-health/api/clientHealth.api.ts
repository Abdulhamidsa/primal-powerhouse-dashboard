import { httpClient } from '@/lib/http/client';
import type { ClientHealthResponse } from '@/features/client-health/types/clientHealth.types';

export function buildClientHealthUrl(clientId: string): string {
  return `/api/admin/clients/${clientId}/health-compliance`;
}

export async function getClientHealth(clientId: string): Promise<ClientHealthResponse> {
  return httpClient.get<ClientHealthResponse>(buildClientHealthUrl(clientId));
}
