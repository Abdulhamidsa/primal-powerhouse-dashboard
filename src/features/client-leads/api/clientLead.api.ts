import { httpClient } from '@/lib/http/client';
import type {
  ClientLead,
  CreateClientLeadPayload,
  UpdateClientLeadPayload,
} from '@/features/client-leads/types/clientLead.types';

export function buildClientLeadsUrl(): string {
  return '/api/client-leads';
}

export function buildClientLeadUrl(id: string): string {
  return `/api/client-leads/${encodeURIComponent(id)}`;
}

export async function getClientLeads(): Promise<ClientLead[]> {
  return httpClient.get<ClientLead[]>(buildClientLeadsUrl());
}

export async function getClientLead(id: string): Promise<ClientLead & { credentialPassword?: string | null }> {
  return httpClient.get(buildClientLeadUrl(id));
}

export async function createClientLead(payload: CreateClientLeadPayload): Promise<ClientLead> {
  return httpClient.post<ClientLead>(buildClientLeadsUrl(), payload);
}

export async function updateClientLead(id: string, payload: UpdateClientLeadPayload): Promise<ClientLead> {
  return httpClient.patch<ClientLead>(buildClientLeadUrl(id), payload);
}

export async function deleteClientLead(id: string): Promise<{ message: string }> {
  return httpClient.delete<{ message: string }>(buildClientLeadUrl(id));
}
