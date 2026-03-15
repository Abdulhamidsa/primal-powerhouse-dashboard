'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

export function ChatPanel({ title, hideConversationList = false }: { title?: string; hideConversationList?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
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

  const unreadTotal = useMemo(
    () => sortedConversations.reduce((sum, item) => sum + item.unreadCount, 0),
    [sortedConversations]
  );

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

    const scrollToBottom = () => {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'smooth',
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
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] bg-[var(--color-surface)]">
      <div
        className="flex items-center justify-between border-b px-4 py-3.5"
        style={{
          borderColor: 'var(--color-border)',
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 8%, var(--color-surface)) 0%, var(--color-surface) 100%)',
        }}
      >
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {title ?? 'Chat'}
          </h2>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Direct line with your coach
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px]"
          style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
        >
          {unreadTotal} unread
        </span>
      </div>

      <div ref={containerRef} className="min-h-0 flex-1 flex flex-col md:flex-row">
        {!hideConversationList ? (
          <aside
            className="border-b p-2 md:border-b-0 md:border-r shrink-0 md:min-w-[320px] md:max-w-[620px] md:w-[var(--chat-sidebar-width)]"
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
                    className="w-full rounded-lg border px-3 py-2 text-left"
                    style={{
                      borderColor:
                        selectedConversationId === conversation.id ? 'var(--color-accent)' : 'var(--color-border)',
                      background:
                        selectedConversationId === conversation.id
                          ? 'var(--color-accent-muted)'
                          : 'var(--color-surface)',
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
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
            className={`hidden md:block w-1 cursor-col-resize ${isDragging ? 'bg-[var(--color-accent)]' : 'bg-transparent'}`}
          />
        ) : null}

        <section className="min-h-0 flex-1 flex flex-col">
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
            className="border-t px-3 py-3 md:px-4"
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
