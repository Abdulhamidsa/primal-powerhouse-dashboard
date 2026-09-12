import { httpClient } from '@/lib/http/client';
import { fileForm } from '@/features/media/api/media.api';
import type { NativeFile } from '@/features/media/types/media.types';
import type {
  ConversationListResponse,
  ConversationMessagesResponse,
  ConversationSummary,
  MessageAttachment,
  ConversationUploadResponse,
} from '../types/chat.types';
export const listConversations = () => httpClient.get<ConversationListResponse>('/api/conversations');
export async function createConversation(): Promise<ConversationSummary> {
  // The client GET provisions its assigned-coach conversation; POST is coach-only.
  const conversations = await listConversations();
  const conversation = conversations.items[0];
  if (!conversation) throw new Error('Your coach conversation is not available yet. Please contact your coach.');
  return conversation;
}
export const getMessages = (id: string) =>
  httpClient.get<ConversationMessagesResponse>(`/api/conversations/${encodeURIComponent(id)}/messages`);
export const sendMessage = (id: string, body: string, attachments: MessageAttachment[], clientTempId: string) =>
  httpClient.send(`/api/conversations/${encodeURIComponent(id)}/messages`, 'POST', { body, attachments, clientTempId });
export const uploadAttachment = (id: string, file: NativeFile) =>
  httpClient.postForm<ConversationUploadResponse>(
    `/api/conversations/${encodeURIComponent(id)}/upload`,
    fileForm(file),
  );
export const presence = (conversationId: string | null) =>
  httpClient.send('/api/conversations/presence', 'POST', { conversationId });
export const registerPush = (token: string) => httpClient.send('/api/push/mobile', 'POST', { token });
export const authorizeChannel = (socketId: string, channel: string) => {
  const form = new FormData();
  form.append('socket_id', socketId);
  form.append('channel_name', channel);
  return httpClient.postForm<{ auth: string }>('/api/realtime/pusher-auth', form);
};
