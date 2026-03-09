import { httpClient } from '@/lib/http/client';
import { clientProfileEditSchema } from '@/features/client-profile-edit/schemas/clientProfileEdit.schema';
import type {
  ClientProfileEditPayload,
  ClientProfileEditResponse,
} from '@/features/client-profile-edit/types/clientProfileEdit.types';

export function buildClientProfileEditUrl(clientId: string): string {
  return `/api/clients/${clientId}`;
}

export async function updateClientProfile(
  clientId: string,
  payload: ClientProfileEditPayload
): Promise<ClientProfileEditResponse> {
  const parsed = clientProfileEditSchema.parse(payload);
  return httpClient.put<ClientProfileEditResponse>(buildClientProfileEditUrl(clientId), parsed);
}
