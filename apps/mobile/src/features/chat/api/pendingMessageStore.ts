import AsyncStorage from '@react-native-async-storage/async-storage';
import { pendingMessageSchema } from '../schemas/pendingMessage.schema';
import type { PendingMessage } from '../types/chat.types';

const key = (userId: string, conversationId: string) => `primal:${userId}:pending-message:${conversationId}`;
export async function loadPendingMessage(userId: string, conversationId: string): Promise<PendingMessage | null> {
  const raw = await AsyncStorage.getItem(key(userId, conversationId));
  if (!raw) return null;
  const message = pendingMessageSchema.parse(JSON.parse(raw));
  if (message.conversationId !== conversationId) throw new Error('Saved message does not match this conversation.');
  return message;
}
export async function savePendingMessage(userId: string, message: PendingMessage) {
  const parsed = pendingMessageSchema.parse(message);
  await AsyncStorage.setItem(key(userId, parsed.conversationId), JSON.stringify(parsed));
}
export async function clearSentMessage(userId: string, conversationId: string) {
  // Clear the confirmed attempt and its composer drafts together. Until this
  // succeeds, another explicit retry uses the original server deduplication ID.
  await AsyncStorage.multiRemove([
    key(userId, conversationId),
    `primal:${userId}:draft:chat:${conversationId}`,
    `primal:${userId}:draft:chat-attachments:${conversationId}`,
  ]);
}
