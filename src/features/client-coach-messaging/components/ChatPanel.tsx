'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MessageList } from '@/features/client-coach-messaging/components/MessageList';
import { MessageComposer } from '@/features/client-coach-messaging/components/MessageComposer';
import {
  useConversationMessages,
  useConversations,
  useMessagingSelection,
} from '@/features/client-coach-messaging/hooks/useMessaging';
import { useConversationPresence } from '@/features/client-coach-messaging/hooks/useConversationPresence';

const SIDEBAR_WIDTH_STORAGE_KEY = 'chat-panel-sidebar-width';
const SIDEBAR_MIN = 320;
const SIDEBAR_MAX = 620;

function clampSidebarWidth(nextWidth: number): number {
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(nextWidth)));
}

export function ChatPanel({
  hideConversationList = false,
  disableUrlSync = false,
}: {
  title?: string;
  hideConversationList?: boolean;
  disableUrlSync?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const previousConversationIdRef = useRef<string | null>(null);
  const hasInitialScrolledSet = useRef<Set<string>>(new Set());
  const wasNearBottomRef = useRef(true);
  const previousMessagesCountRef = useRef(0);
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { conversations, isLoading: isConversationsLoading } = useConversations();
  const requestedConversationId = disableUrlSync ? null : searchParams.get('conversationId');
  const { selectedConversationId, setSelectedConversationId, sortedConversations } = useMessagingSelection(
    conversations,
    requestedConversationId,
  );
  const {
    conversation,
    messages,
    isLoading: isMessagesLoading,
    sendMessage,
    retryMessage,
  } = useConversationMessages(selectedConversationId);

  useConversationPresence(selectedConversationId, pathname.startsWith('/user'));

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
    if (disableUrlSync || !selectedConversationId) return;

    const next = new URLSearchParams(searchParams.toString());
    if (next.get('conversationId') === selectedConversationId) {
      return;
    }

    next.set('conversationId', selectedConversationId);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [disableUrlSync, pathname, router, searchParams, selectedConversationId]);

  // Track whether the user is near the bottom so we know whether to auto-scroll on new messages.
  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    const onScroll = () => {
      wasNearBottomRef.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 72;
    };
    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;

    const convId = selectedConversationId ?? '';
    const conversationChanged = previousConversationIdRef.current !== selectedConversationId;
    previousConversationIdRef.current = selectedConversationId;

    const prevCount = previousMessagesCountRef.current;
    previousMessagesCountRef.current = messages.length;

    if (conversationChanged) {
      // Reset per-conversation state so the next load always jumps to bottom.
      hasInitialScrolledSet.current.delete(convId);
      wasNearBottomRef.current = true;
    }

    // First time we have messages for this conversation: hard-jump to bottom.
    if (!hasInitialScrolledSet.current.has(convId)) {
      if (messages.length > 0) {
        hasInitialScrolledSet.current.add(convId);
        const id = window.requestAnimationFrame(() =>
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'auto' }),
        );
        return () => window.cancelAnimationFrame(id);
      }
      return;
    }

    // Subsequent message additions (e.g. optimistic send, Pusher push):
    // Always scroll when the user just sent (last message is pending).
    // Otherwise only scroll if the user was near the bottom.
    const lastMessage = messages[messages.length - 1];
    const userJustSent = lastMessage?.deliveryStatus === 'pending';

    if (messages.length > prevCount && (userJustSent || wasNearBottomRef.current)) {
      const id = window.requestAnimationFrame(() =>
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' }),
      );
      return () => window.cancelAnimationFrame(id);
    }
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
    <div className="flex h-full flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
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
            className="flex items-center gap-3 border-b px-4 py-2.5"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            {hideConversationList ? (
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Back"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-[var(--color-bg-alt)]"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                <ArrowLeft size={16} />
              </button>
            ) : null}
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Coach chat
            </p>
          </div>

          <div
            ref={messageViewportRef}
            className="flex-1 overflow-y-auto px-3 py-4 md:px-4"
            style={{ background: 'var(--color-bg-alt)' }}
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
              background: 'var(--color-surface)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <MessageComposer conversationId={selectedConversationId} onSendAction={sendMessage} />
          </div>
        </section>
      </div>
    </div>
  );
}
