'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageList } from '@/features/client-coach-messaging/components/MessageList';
import { MessageComposer } from '@/features/client-coach-messaging/components/MessageComposer';
import {
  useConversationMessages,
  useConversations,
  useMessagingSelection,
} from '@/features/client-coach-messaging/hooks/useMessaging';

const SIDEBAR_WIDTH_STORAGE_KEY = 'chat-panel-sidebar-width';
const SIDEBAR_MIN = 320;
const SIDEBAR_MAX = 620;

function clampSidebarWidth(nextWidth: number): number {
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(nextWidth)));
}

export function ChatPanel({  hideConversationList = false }: { title?: string; hideConversationList?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const previousConversationIdRef = useRef<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { conversations, isLoading: isConversationsLoading } = useConversations();
  const { selectedConversationId, setSelectedConversationId, sortedConversations } =
    useMessagingSelection(conversations);
  const {
    conversation,
    messages,
    isLoading: isMessagesLoading,
    sendMessage,
    retryMessage,
  } = useConversationMessages(selectedConversationId);



  useEffect(() => {
    if (hideConversationList || typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (Number.isFinite(parsed)) {
        setSidebarWidth(clampSidebarWidth(parsed));
        return;
      }
    }

    const initial = containerRef.current?.clientWidth;
    if (initial) {
      setSidebarWidth(clampSidebarWidth(initial * 0.35));
    }
  }, [hideConversationList]);

  useEffect(() => {
    if (hideConversationList || !sidebarWidth || typeof window === 'undefined') return;
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [hideConversationList, sidebarWidth]);

  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;

    const conversationChanged = previousConversationIdRef.current !== selectedConversationId;
    previousConversationIdRef.current = selectedConversationId;

    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const isNearBottom = distanceFromBottom <= 72;

    // Always jump to the bottom when switching conversations.
    if (conversationChanged) {
      const animationFrameId = window.requestAnimationFrame(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'auto' });
      });

      return () => window.cancelAnimationFrame(animationFrameId);
    }

    // Keep user position intact when reading older messages.
    if (!isNearBottom) {
      return;
    }

    const scrollToBottom = () => {
      const nextDistanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: nextDistanceFromBottom <= 12 ? 'auto' : 'smooth',
      });
    };

    const animationFrameId = window.requestAnimationFrame(scrollToBottom);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [selectedConversationId, messages]);

  const startDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (hideConversationList) return;
    event.preventDefault();

    const baseWidth = sidebarWidth ?? clampSidebarWidth((containerRef.current?.clientWidth ?? 1000) * 0.35);
    const startX = event.clientX;

    setIsDragging(true);

    const onMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setSidebarWidth(clampSidebarWidth(baseWidth + delta));
    };

    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
  <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]">
  <div ref={containerRef} className="flex min-h-0 flex-1 flex-col md:flex-row">
    {!hideConversationList ? (
      <aside
        className="shrink-0 border-b p-2 md:min-w-[320px] md:w-[var(--chat-sidebar-width)] md:max-w-[620px] md:border-b-0 md:border-r"
        style={{
          borderColor: 'var(--color-border)',
          ['--chat-sidebar-width' as string]: sidebarWidth ? `${sidebarWidth}px` : undefined,
        }}
      >
        {isConversationsLoading ? (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Loading conversations...
          </p>
        ) : (
          <div className="space-y-1">
            {sortedConversations.map(conversation => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedConversationId(conversation.id)}
                className="w-full rounded-2xl border px-3 py-3 text-left transition-all"
                style={{
                  borderColor:
                    selectedConversationId === conversation.id ? 'var(--color-accent)' : 'var(--color-border)',
                  background:
                    selectedConversationId === conversation.id
                      ? 'var(--color-accent-muted)'
                      : 'var(--color-surface)',
                }}
              >
                <p className="truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {conversation.clientName}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {conversation.unreadCount > 0 ? `${conversation.unreadCount} unread` : 'No unread'}
                </p>
              </button>
            ))}
          </div>
        )}
      </aside>
    ) : null}

    {!hideConversationList ? (
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize conversation list"
        onMouseDown={startDrag}
        className={`hidden w-1 cursor-col-resize md:block ${isDragging ? 'bg-[var(--color-accent)]' : 'bg-transparent'}`}
      />
    ) : null}

    <section className="flex min-h-0 flex-1 flex-col">
      <div
        className="border-b px-4 py-4"
        style={{
          borderColor: 'var(--color-border)',
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, transparent) 0%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold"
            style={{
              background: 'var(--color-accent-muted)',
              color: 'var(--color-accent)',
            }}
          >
            {conversation?.clientName?.slice(0, 1)?.toUpperCase() ?? '?'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold md:text-base" style={{ color: 'var(--color-text)' }}>
                {conversation?.clientName ?? 'Select a conversation'}
              </h2>

              {conversation?.unreadCount ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: 'var(--color-accent-muted)',
                    color: 'var(--color-accent)',
                  }}
                >
                  {conversation.unreadCount} unread
                </span>
              ) : null}
            </div>

            <p className="truncate text-[11px] md:text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {conversation ? 'Conversation history' : 'Choose a conversation from the list'}
            </p>
          </div>
        </div>
      </div>

      <div
        ref={messageViewportRef}
        className="flex-1 overflow-y-auto px-3 py-4 md:px-4"
        style={{
          background:
            'radial-gradient(circle at top, color-mix(in srgb, var(--color-accent) 7%, transparent) 0%, transparent 38%), var(--color-bg-alt)',
        }}
      >
        {isMessagesLoading ? (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Loading messages...
          </p>
        ) : (
          <MessageList conversation={conversation} messages={messages} onRetryAction={retryMessage} />
        )}
      </div>

      <div
        className="border-t"
        style={{
          borderColor: 'var(--color-border)',
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 82%, transparent) 0%, var(--color-surface) 100%)',
        }}
      >
        <MessageComposer conversationId={selectedConversationId} onSendAction={sendMessage} />
      </div>
    </section>
  </div>
</div>
  );
}
