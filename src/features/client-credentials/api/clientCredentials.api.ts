import { httpClient } from '@/lib/http/client';
import type {
  ClientCredentials,
  ResetClientPasswordResponse,
} from '@/features/client-credentials/types/clientCredentials.types';

export function buildClientCredentialsUrl(clientId: string): string {
  return `/api/clients/${encodeURIComponent(clientId)}/credentials`;
}

export function buildClientPasswordResetUrl(clientId: string): string {
  return `/api/clients/${encodeURIComponent(clientId)}/password`;
}

export async function getClientCredentials(clientId: string): Promise<ClientCredentials> {
  return httpClient.get<ClientCredentials>(buildClientCredentialsUrl(clientId));
}

export async function resetClientPassword(clientId: string): Promise<ResetClientPasswordResponse> {
  return httpClient.post<ResetClientPasswordResponse>(buildClientPasswordResetUrl(clientId));
}
