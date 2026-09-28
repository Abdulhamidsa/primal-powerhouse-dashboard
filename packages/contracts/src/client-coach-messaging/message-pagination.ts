import type { ChatMessage, ConversationMessagesResponse } from './types/messaging.types';

export type MessagePageMergeMode = 'latest' | 'older';

const INITIAL_MESSAGE_PAGE_SIZE = 20;

export function mergeChatMessages(...groups: ChatMessage[][]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();

  for (const group of groups) {
    for (const message of group) {
      byId.set(message.id, message);
    }
  }

  return [...byId.values()].sort((a, b) => {
    const timeDifference = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (timeDifference !== 0) return timeDifference;
    return a.id.localeCompare(b.id);
  });
}

export function mergeConversationMessagePage(
  current: ConversationMessagesResponse | undefined,
  incoming: ConversationMessagesResponse,
  mode: MessagePageMergeMode,
): ConversationMessagesResponse {
  if (!current || current.conversation.id !== incoming.conversation.id) {
    return incoming;
  }

  const items = mergeChatMessages(current.items, incoming.items);
  const currentHistoryIsComplete = !current.hasMore && items.length > INITIAL_MESSAGE_PAGE_SIZE;
  const preserveCurrentPagination = current.hasMore || currentHistoryIsComplete;

  return {
    conversation: incoming.conversation,
    items,
    hasMore:
      mode === 'older'
        ? incoming.hasMore
        : preserveCurrentPagination
          ? current.hasMore
          : incoming.hasMore,
    nextCursor:
      mode === 'older'
        ? incoming.nextCursor
        : preserveCurrentPagination
          ? current.nextCursor
          : incoming.nextCursor,
  };
}
