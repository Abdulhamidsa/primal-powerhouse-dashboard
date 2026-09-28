import { httpClient } from '@/lib/http/client';
import type {
  ConversationListResponse,
  ConversationMessagesResponse,
  ConversationSummary,
  ConversationUploadResponse,
  CreateConversationPayload,
  SendMessagePayload,
  ChatMessage,
} from '@/features/client-coach-messaging/types/messaging.types';

export function buildConversationsUrl(): string {
  return '/api/conversations';
}

export function buildConversationMessagesUrl(conversationId: string, cursor?: string | null): string {
  const url = `/api/conversations/${encodeURIComponent(conversationId)}/messages`;
  return cursor ? `${url}?cursor=${encodeURIComponent(cursor)}` : url;
}

export function buildConversationUploadUrl(conversationId: string): string {
  return `/api/conversations/${encodeURIComponent(conversationId)}/upload`;
}

export async function listConversations(): Promise<ConversationListResponse> {
  return httpClient.get<ConversationListResponse>(buildConversationsUrl());
}

export async function createConversation(payload: CreateConversationPayload): Promise<ConversationSummary> {
  return httpClient.post<ConversationSummary>(buildConversationsUrl(), payload);
}

export async function listConversationMessages(
  conversationId: string,
  cursor?: string | null,
): Promise<ConversationMessagesResponse> {
  return httpClient.get<ConversationMessagesResponse>(buildConversationMessagesUrl(conversationId, cursor));
}

export async function sendConversationMessage(
  conversationId: string,
  payload: SendMessagePayload
): Promise<ChatMessage> {
  return httpClient.post<ChatMessage>(buildConversationMessagesUrl(conversationId), payload);
}

export async function uploadConversationAttachment(
  conversationId: string,
  file: File
): Promise<ConversationUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return httpClient.postForm<ConversationUploadResponse>(buildConversationUploadUrl(conversationId), formData);
}
