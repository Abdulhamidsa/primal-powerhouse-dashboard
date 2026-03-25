export function toConversationChannel(conversationId: string): string {
  return `private-conversation-${conversationId}`;
}

export function toUserChannel(userId: string): string {
  return `private-user-${userId}`;
}
