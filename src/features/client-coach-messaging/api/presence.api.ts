import { httpClient } from '@/lib/http/client';
import type {
  ConversationPresencePayload,
  ClientPresenceResponse,
} from '@/features/client-coach-messaging/types/presence.types';

export async function updateConversationPresence(payload: ConversationPresencePayload): Promise<{ success: true }> {
  return httpClient.post<{ success: true }>('/api/conversations/presence', payload);
}

export async function getConversationClientPresence(clientId: string): Promise<ClientPresenceResponse> {
  return httpClient.get<ClientPresenceResponse>(`/api/conversations/presence?clientId=${encodeURIComponent(clientId)}`);
}
