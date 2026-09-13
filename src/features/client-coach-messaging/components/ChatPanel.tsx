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
import { useConversationClientPresence } from '@/features/client-coach-messaging/hooks/useConversationClientPresence';

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return (words[0][0] ?? '?').toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const SIDEBAR_WIDTH_STORAGE_KEY = 'chat-panel-sidebar-width';
const SIDEBAR_MIN = 320;
const SIDEBAR_MAX = 620;

function clampSidebarWidth(nextWidth: number): number {
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(nextWidth)));
}

function MessageSkeleton() {
  return (
    <div className="flex min-h-full flex-col justify-end gap-4 px-1 py-2">
      {[0, 1, 2, 3, 4].map(index => {
        const own = index % 2 === 1;
        return (
          <div key={index} className={`flex items-end gap-2 ${own ? 'justify-end' : 'justify-start'}`}>
            {!own ? <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-bg-alt)]" /> : null}
            <div
              className={`h-12 animate-pulse rounded-[24px] bg-[var(--color-surface)] ${own ? 'w-[48%]' : 'w-[68%]'}`}
              style={{ border: '1px solid var(--color-border)' }}
            />
            {own ? <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-bg-alt)]" /> : null}
          </div>
        );
      })}
    </div>
  );
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
  const messageContentRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
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
  const selectedConversation = sortedConversations.find(c => c.id === selectedConversationId) ?? null;
  const { isActive } = useConversationClientPresence(selectedConversation?.clientId ?? null);
  const {
    conversation,
    messages,
    isLoading: isMessagesLoading,
    sendMessage,
    retryMessage,
  } = useConversationMessages(selectedConversationId);

  useConversationPresence(selectedConversationId, pathname.startsWith('/user'));
  const showMessageSkeleton = isConversationsLoading || (Boolean(selectedConversationId) && isMessagesLoading && messages.length === 0);

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
        // Double-rAF: first rAF lets React commit the new message nodes;
        // second rAF fires after the browser has measured and painted them,
        // so scrollHeight is the true full height.
        const outer = window.requestAnimationFrame(() => {
          const inner = window.requestAnimationFrame(() =>
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'auto' }),
          );
          return inner;
        });
        return () => window.cancelAnimationFrame(outer);
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
        bottomRef.current?.scrollIntoView({ block: 'end', behavior: userJustSent ? 'smooth' : 'auto' }),
      );
      return () => window.cancelAnimationFrame(id);
    }
  }, [selectedConversationId, messages]);

  useEffect(() => {
    const viewport = messageViewportRef.current;
    const content = messageContentRef.current;
    if (!viewport || !content || !bottomRef.current) return;

    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
      bottomRef.current?.scrollIntoView({ block: 'end', behavior });
    };

    const id = window.requestAnimationFrame(() => scrollToBottom('auto'));
    const observer = new ResizeObserver(() => {
      if (wasNearBottomRef.current) scrollToBottom('auto');
    });
    observer.observe(content);

    const mutationObserver = new MutationObserver(() => {
      if (wasNearBottomRef.current) scrollToBottom('auto');
    });
    mutationObserver.observe(content, { childList: true, subtree: true });

    return () => {
      window.cancelAnimationFrame(id);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [selectedConversationId, messages.length]);

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
    <div className="flex h-full flex-col overflow-hidden bg-[var(--color-surface)]">
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
              <div className="space-y-0.5 p-1">
                {sortedConversations.map(conv => {
                  const isSelected = selectedConversationId === conv.id;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setSelectedConversationId(conv.id)}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-bg-alt)]"
                      style={{
                        background: isSelected ? 'var(--color-accent-muted)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--color-accent)' : '3px solid transparent',
                      }}
                    >
                      <div
                        className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          background: 'var(--color-bg-alt)',
                          color: 'var(--color-accent)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        {getInitials(conv.clientName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            {conv.clientName}
                          </p>
                          {conv.lastMessageAt ? (
                            <span className="flex-shrink-0 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                              {formatRelativeTime(conv.lastMessageAt)}
                            </span>
                          ) : null}
                        </div>

                        {conv.unreadCount > 0 ? (
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                              style={{ background: 'var(--color-accent)', color: '#fff' }}
                            >
                              {conv.unreadCount}
                            </span>
                            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                              new
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
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
            className="flex items-center gap-3 border-b px-4 py-3 backdrop-blur-xl"
            style={{
              borderColor: 'var(--color-border)',
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, transparent), color-mix(in srgb, var(--color-surface) 88%, transparent))',
              paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
            }}
          >
            {hideConversationList ? (
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Back"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-[var(--color-bg-alt)]"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                <ArrowLeft size={20} />
              </button>
            ) : null}

            {!hideConversationList ? (
              selectedConversation ? (
                <div className="flex items-center gap-2 min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {selectedConversation.clientName}
                  </p>
                  {isActive ? (
                    <span className="inline-flex flex-shrink-0 items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Active
                      </span>
                    </span>
                  ) : null}
                </div>
              ) : (
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Select a conversation
                </p>
              )
            ) : (
              <p
                className="text-[12px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Coach chat
              </p>
            )}
          </div>

          <div
            ref={messageViewportRef}
            className="flex-1 overflow-y-auto px-3 pb-8 pt-4 md:px-4"
            style={{
              background:
                'radial-gradient(circle at top, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 38%), var(--color-bg)',
            }}
          >
            {showMessageSkeleton ? (
              <MessageSkeleton />
            ) : (
              <div ref={messageContentRef} className="min-h-full">
                <MessageList conversation={conversation} messages={messages} onRetryAction={retryMessage} />
                <div ref={bottomRef} className="h-3" />
              </div>
            )}
          </div>

          <div
            className="border-t px-2 pt-2"
            style={{
              borderColor: 'var(--color-border)',
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 92%, transparent), var(--color-surface))',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
            }}
          >
            <MessageComposer conversationId={selectedConversationId} onSendAction={sendMessage} />
          </div>
        </section>
      </div>
    </div>
  );
}
