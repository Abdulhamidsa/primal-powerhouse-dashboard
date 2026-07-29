import { httpClient } from '@/lib/http/client';
import { createClientSchema } from '@/features/client-creation/schemas/clientCreation.schema';
import type { CreateClientPayload, CreateClientResponse } from '@/features/client-creation/types/clientCreation.types';

export function buildClientsUrl(): string {
  return '/api/clients';
}

export async function createClient(payload: CreateClientPayload): Promise<CreateClientResponse> {
  const parsed = createClientSchema.parse(payload);
  return httpClient.post<CreateClientResponse>(buildClientsUrl(), parsed);
}
