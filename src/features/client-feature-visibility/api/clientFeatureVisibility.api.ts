import { httpClient } from '@/lib/http/client';
import { ClientFeatureVisibilityResponse, ClientFeatureVisibilityData } from '../types/clientFeatureVisibility.types';

export function buildClientFeatureVisibilityUrl(clientId: string): string {
  return `/api/clients/${clientId}/feature-visibility`;
}

export async function getClientFeatureVisibility(clientId: string): Promise<ClientFeatureVisibilityResponse> {
  return httpClient.get<ClientFeatureVisibilityResponse>(buildClientFeatureVisibilityUrl(clientId));
}

export async function updateClientFeatureVisibility(
  clientId: string,
  payload: ClientFeatureVisibilityData,
): Promise<ClientFeatureVisibilityResponse> {
  return httpClient.put<ClientFeatureVisibilityResponse>(
    buildClientFeatureVisibilityUrl(clientId),
    payload,
  );
}
