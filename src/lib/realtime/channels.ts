export function toConversationChannel(conversationId: string): string {
  return `private-conversation-${conversationId}`;
}
