import { httpClient } from '@/lib/http/client';
import type { ConversationPresencePayload } from '@/features/client-coach-messaging/types/presence.types';

export async function updateConversationPresence(payload: ConversationPresencePayload): Promise<{ success: true }> {
  return httpClient.post<{ success: true }>('/api/conversations/presence', payload);
}
