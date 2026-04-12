export const CONVERSATION_PRESENCE_TTL_MS = 60_000;

export type ConversationPresenceSnapshot = {
  conversationId: string | null;
  lastSeenAt: Date | string | null;
};

export function buildConversationDeepLink(conversationId: string): string {
  return `/user/chat?conversationId=${encodeURIComponent(conversationId)}`;
}

export function buildMessagePreview(body: string | null | undefined, hasAttachment: boolean): string {
  const trimmedBody = body?.trim() ?? '';
  if (trimmedBody) {
    return trimmedBody.length > 120 ? `${trimmedBody.slice(0, 120)}…` : trimmedBody;
  }

  return hasAttachment ? 'Sent you an attachment' : 'Sent you a new message';
}

export function hasFreshConversationPresence(
  snapshot: ConversationPresenceSnapshot | null | undefined,
  conversationId: string,
  now = Date.now(),
): boolean {
  if (!snapshot || snapshot.conversationId !== conversationId || !snapshot.lastSeenAt) {
    return false;
  }

  const lastSeenAtMs = snapshot.lastSeenAt instanceof Date ? snapshot.lastSeenAt.getTime() : Date.parse(snapshot.lastSeenAt);
  if (!Number.isFinite(lastSeenAtMs)) {
    return false;
  }

  return now - lastSeenAtMs <= CONVERSATION_PRESENCE_TTL_MS;
}
