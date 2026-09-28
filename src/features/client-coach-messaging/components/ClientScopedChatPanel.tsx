'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageList } from '@/features/client-coach-messaging/components/MessageList';
import { MessageComposer } from '@/features/client-coach-messaging/components/MessageComposer';
import { useConversationMessages, useEnsureConversation } from '@/features/client-coach-messaging/hooks/useMessaging';
import { useMessageScroll } from '@/features/client-coach-messaging/hooks/useMessageScroll';
import type { ConversationSummary } from '@/features/client-coach-messaging/types/messaging.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null) {
    const candidate = (error as { message?: unknown }).message;
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return 'Could not open chat right now.';
}

export function ClientScopedChatPanel({ clientId }: { clientId: string }) {
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const { ensureConversation } = useEnsureConversation();

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setSetupError(null);
        const ensured = await ensureConversation({ clientId });
        if (mounted) {
          setConversation(ensured);
        }
      } catch (error) {
        console.error('Failed to initialize client conversation:', getErrorMessage(error), error);
        if (mounted) {
          setSetupError(getErrorMessage(error));
        }
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [clientId, ensureConversation]);

  const {
    messages,
    isLoading,
    hasMore,
    isLoadingOlder,
    loadOlderMessages,
    sendMessage,
    retryMessage,
  } = useConversationMessages(conversation?.id ?? null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const messageScroll = useMessageScroll({
    conversationId: conversation?.id ?? null,
    viewportRef,
    messageCount: messages.length,
    firstMessageId: messages[0]?.id ?? null,
    lastMessageId: messages.at(-1)?.id ?? null,
    hasMore,
    isLoadingOlder,
    loadOlderMessages,
  });

  if (setupError) {
    return (
      <div className="p-3">
        <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
          {setupError}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div
        ref={viewportRef}
        onScroll={messageScroll.onScroll}
        onWheel={messageScroll.onWheel}
        onTouchMove={messageScroll.onTouchMove}
        className="relative flex-1 overflow-y-auto p-3"
        style={{ background: 'var(--color-bg-alt)' }}
      >
        {isLoading ? (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Loading chat...
          </p>
        ) : (
          <MessageList conversation={conversation} messages={messages} onRetryAction={retryMessage} />
        )}
        {isLoadingOlder ? (
          <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full border bg-[var(--color-surface)]/90 px-3 py-1 text-[10px] text-[var(--color-text-muted)] shadow-sm backdrop-blur">
            Loading older messages…
          </div>
        ) : null}
      </div>

      <div className="border-t p-3" style={{ borderColor: 'var(--color-border)' }}>
        <MessageComposer conversationId={conversation?.id ?? null} onSendAction={sendMessage} />
      </div>
    </div>
  );
}
