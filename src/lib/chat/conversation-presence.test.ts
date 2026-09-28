import { describe, expect, it } from 'vitest';
import {
  CONVERSATION_PRESENCE_TTL_MS,
  buildConversationDeepLink,
  buildMessagePreview,
  hasFreshConversationPresence,
} from './conversation-presence';

describe('conversation presence helpers', () => {
  it('builds a user chat deep link with conversation id', () => {
    expect(buildConversationDeepLink('abc123')).toBe('/user/chat?conversationId=abc123');
  });

  it('truncates message previews and falls back for attachments', () => {
    expect(buildMessagePreview('hello', false)).toBe('hello');
    expect(buildMessagePreview('', true)).toBe('Sent you an attachment');
    expect(buildMessagePreview('x'.repeat(130), false)).toBe(`${'x'.repeat(120)}…`);
  });

  it('only treats matching recent conversation presence as fresh', () => {
    const now = Date.now();

    expect(
      hasFreshConversationPresence({ conversationId: 'conv-1', lastSeenAt: new Date(now - 10_000) }, 'conv-1', now),
    ).toBe(true);

    expect(
      hasFreshConversationPresence({ conversationId: 'conv-2', lastSeenAt: new Date(now - 10_000) }, 'conv-1', now),
    ).toBe(false);

    expect(
      hasFreshConversationPresence(
        { conversationId: 'conv-1', lastSeenAt: new Date(now - CONVERSATION_PRESENCE_TTL_MS - 1) },
        'conv-1',
        now,
      ),
    ).toBe(false);
  });
});
