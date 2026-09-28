import { describe, expect, it } from 'vitest';
import {
  mergeChatMessages,
  mergeConversationMessagePage,
} from '@primal/contracts/client-coach-messaging/message-pagination';
import { preserveScrollOffset } from '@primal/contracts/client-coach-messaging/scroll';
import { decodeMessageCursor, encodeMessageCursor } from '@/lib/chat/message-pagination';
import type {
  ChatMessage,
  ConversationMessagesResponse,
  ConversationSummary,
} from '@primal/contracts/client-coach-messaging/types/messaging.types';

const conversation: ConversationSummary = {
  id: 'conversation-1',
  clientId: 'client-1',
  clientName: 'Client',
  clientAvatar: null,
  coachId: 'coach-1',
  coachName: 'Coach',
  lastMessageAt: '2026-09-28T12:00:00.000Z',
  createdAt: '2026-09-28T10:00:00.000Z',
  updatedAt: '2026-09-28T12:00:00.000Z',
  unreadCount: 0,
};

function message(id: string, createdAt: string, body = id): ChatMessage {
  return {
    id,
    conversationId: conversation.id,
    senderId: 'sender-1',
    senderRole: 'COACH',
    body,
    attachments: [],
    createdAt,
  };
}

function page(items: ChatMessage[], hasMore: boolean, nextCursor: string | null): ConversationMessagesResponse {
  return { conversation, items, hasMore, nextCursor };
}

describe('chat message pagination', () => {
  it('round-trips an opaque composite cursor', () => {
    const cursor = { createdAt: '2026-09-28T12:00:00.000Z', id: 'message-20' };
    const encoded = encodeMessageCursor(cursor);

    expect(encoded).not.toContain('{');
    expect(decodeMessageCursor(encoded)).toEqual(cursor);
    expect(decodeMessageCursor('not-a-cursor')).toBeNull();
  });

  it('sorts equal-timestamp messages by ID without dropping either one', () => {
    const sameTimestamp = '2026-09-28T12:00:00.000Z';

    expect(
      mergeChatMessages([
        message('message-b', sameTimestamp),
        message('message-a', sameTimestamp),
      ]),
    ).toMatchObject([{ id: 'message-a' }, { id: 'message-b' }]);
  });

  it('merges older pages chronologically and deduplicates the boundary', () => {
    const initial = page(
      [message('message-2', '2026-09-28T12:00:00.000Z'), message('message-3', '2026-09-28T13:00:00.000Z')],
      true,
      'cursor-older',
    );
    const older = page(
      [message('message-1', '2026-09-28T11:00:00.000Z'), message('message-2', '2026-09-28T12:00:00.000Z')],
      false,
      null,
    );

    const merged = mergeConversationMessagePage(initial, older, 'older');

    expect(merged.items.map(item => item.id)).toEqual(['message-1', 'message-2', 'message-3']);
    expect(merged.hasMore).toBe(false);
    expect(merged.nextCursor).toBeNull();
  });

  it('preserves loaded history when the newest page is refreshed', () => {
    const current = page(
      [message('message-1', '2026-09-28T11:00:00.000Z'), message('message-2', '2026-09-28T12:00:00.000Z')],
      true,
      'cursor-older',
    );
    const latest = page(
      [message('message-2', '2026-09-28T12:00:00.000Z'), message('message-3', '2026-09-28T13:00:00.000Z')],
      true,
      'cursor-latest',
    );

    const merged = mergeConversationMessagePage(current, latest, 'latest');

    expect(merged.items.map(item => item.id)).toEqual(['message-1', 'message-2', 'message-3']);
    expect(merged.nextCursor).toBe('cursor-older');
  });

  it('calculates the exact prepend scroll compensation', () => {
    expect(preserveScrollOffset(240, 1200, 1680)).toBe(720);
  });
});
