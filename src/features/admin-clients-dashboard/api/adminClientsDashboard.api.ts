import { httpClient } from '@/lib/http/client';
import type {
  AdminClientListItem,
  AdminClientDetail,
} from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';
import type { VideoAssignment } from '@/types/video';

export function buildClientsListUrl(archived = false): string {
  return archived ? '/api/clients?archived=true' : '/api/clients';
}

export function buildClientDetailUrl(clientId: string): string {
  return `/api/clients/${encodeURIComponent(clientId)}`;
}

export function buildClientVideoAssignmentsUrl(clientId: string): string {
  const searchParams = new URLSearchParams({ clientId });
  return `/api/video-assignments?${searchParams.toString()}`;
}

export function buildClientNotesPatchUrl(clientId: string): string {
  return `/api/clients/${encodeURIComponent(clientId)}`;
}

export function buildVideoAssignmentUrl(assignmentId: string): string {
  return `/api/video-assignments/${encodeURIComponent(assignmentId)}`;
}

export function buildMealAssignmentUrl(assignmentId: string): string {
  return `/api/meal-assignments/${encodeURIComponent(assignmentId)}`;
}

export async function getAdminClientsList(): Promise<AdminClientListItem[]> {
  return httpClient.get<AdminClientListItem[]>(buildClientsListUrl());
}

export async function getAdminClientDetail(clientId: string): Promise<AdminClientDetail> {
  return httpClient.get<AdminClientDetail>(buildClientDetailUrl(clientId));
}

export async function getClientVideoAssignments(clientId: string): Promise<VideoAssignment[]> {
  return httpClient.get<VideoAssignment[]>(buildClientVideoAssignmentsUrl(clientId));
}

export async function updateClientNotes(clientId: string, notes: string): Promise<AdminClientDetail> {
  return httpClient.put<AdminClientDetail>(buildClientNotesPatchUrl(clientId), { notes });
}

export async function deleteVideoAssignment(assignmentId: string): Promise<{ message: string }> {
  return httpClient.delete<{ message: string }>(buildVideoAssignmentUrl(assignmentId));
}

export async function deleteMealAssignment(assignmentId: string): Promise<{ message: string }> {
  return httpClient.delete<{ message: string }>(buildMealAssignmentUrl(assignmentId));
}

export async function archiveClient(clientId: string): Promise<AdminClientDetail> {
  return httpClient.put<AdminClientDetail>(buildClientDetailUrl(clientId), { status: 'ARCHIVED' });
}

export async function unarchiveClient(clientId: string): Promise<AdminClientDetail> {
  return httpClient.put<AdminClientDetail>(buildClientDetailUrl(clientId), { status: 'ACTIVE' });
}

export async function updateClientAccessMode(
  clientId: string,
  accessMode: 'SELF_SERVICE' | 'COACHING',
): Promise<AdminClientDetail> {
  return httpClient.put<AdminClientDetail>(buildClientDetailUrl(clientId), { accessMode });
}

export async function setClientMotivationalMessage(
  clientId: string,
  motivationalMessage: string,
): Promise<{ success: boolean; client: { id: string; name: string; motivationalMessage: string } }> {
  return httpClient.post('/api/admin/clients/motivational-message', { clientId, motivationalMessage });
}
