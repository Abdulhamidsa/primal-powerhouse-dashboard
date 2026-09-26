'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon as ArrowLeft, TrayIcon as Inbox, ChatTextIcon as MessageSquare, MagnifyingGlassIcon as Search, UserCircleIcon as UserRound } from '@phosphor-icons/react';
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
  variant = 'default',
}: {
  title?: string;
  hideConversationList?: boolean;
  disableUrlSync?: boolean;
  variant?: 'default' | 'admin';
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
  const [conversationSearch, setConversationSearch] = useState('');
  const isAdminVariant = variant === 'admin';

  const { conversations, isLoading: isConversationsLoading } = useConversations();
  const requestedConversationId = disableUrlSync ? null : searchParams.get('conversationId');
  const { selectedConversationId, setSelectedConversationId, sortedConversations } = useMessagingSelection(
    conversations,
    requestedConversationId,
  );
  const selectedConversation = sortedConversations.find(c => c.id === selectedConversationId) ?? null;
  const visibleConversations = useMemo(() => {
    const normalized = conversationSearch.trim().toLowerCase();
    if (!normalized) return sortedConversations;
    return sortedConversations.filter(conv =>
      [conv.clientName, conv.coachName, conv.clientId].filter(Boolean).join(' ').toLowerCase().includes(normalized),
    );
  }, [conversationSearch, sortedConversations]);
  const unreadTotal = useMemo(
    () => sortedConversations.reduce((total, conversationItem) => total + conversationItem.unreadCount, 0),
    [sortedConversations],
  );
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
    if (hideConversationList || isAdminVariant || typeof window === 'undefined') return;

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
  }, [hideConversationList, isAdminVariant]);

  useEffect(() => {
    if (hideConversationList || isAdminVariant || !sidebarWidth || typeof window === 'undefined') return;
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [hideConversationList, isAdminVariant, sidebarWidth]);

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
    if (hideConversationList || isAdminVariant) return;
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
    <div
      className={
        isAdminVariant
          ? 'flex h-full flex-col overflow-hidden bg-[rgba(8,8,10,0.42)]'
          : 'flex h-full flex-col overflow-hidden bg-[var(--color-surface)]'
      }
    >
      <div ref={containerRef} className="flex min-h-0 flex-1 flex-col md:flex-row">
        {!hideConversationList ? (
          <aside
            className={
              isAdminVariant
                ? 'flex shrink-0 flex-col border-b border-white/10 bg-white/[0.025] md:w-[380px] md:border-b-0 md:border-r'
                : 'shrink-0 border-b p-2 md:min-w-[320px] md:w-[var(--chat-sidebar-width)] md:max-w-[620px] md:border-b-0 md:border-r'
            }
            style={{
              borderColor: isAdminVariant ? undefined : 'var(--color-border)',
              ['--chat-sidebar-width' as string]: !isAdminVariant && sidebarWidth ? `${sidebarWidth}px` : undefined,
            }}
          >
            {isAdminVariant ? (
              <div className="shrink-0 border-b border-white/10 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
                      Inbox
                    </p>
                    <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
                      Conversations
                    </h2>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
                    <p className="text-sm font-semibold text-foreground">{sortedConversations.length}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">total</p>
                  </div>
                </div>

                <div className="relative">
                  <Search aria-hidden="true" focusable="false" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={conversationSearch}
                    onChange={event => setConversationSearch(event.target.value)}
                    placeholder="Search clients..."
                    className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--color-accent)]/45 focus:bg-black/30"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground">
                    {unreadTotal > 0 ? `${unreadTotal} unread` : 'All caught up'}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground">
                    Live sync
                  </span>
                </div>
              </div>
            ) : null}

            {isConversationsLoading ? (
              <div className={isAdminVariant ? 'space-y-3 p-4' : 'p-1'}>
                {isAdminVariant ? (
                  [0, 1, 2, 3, 4].map(item => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="h-10 w-10 animate-pulse rounded-full bg-white/[0.07]" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/[0.07]" />
                        <div className="h-3 w-1/3 animate-pulse rounded-full bg-white/[0.05]" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Loading conversations...
                  </p>
                )}
              </div>
            ) : visibleConversations.length === 0 ? (
              <div className="flex flex-1 items-center justify-center p-6 text-center">
                <div>
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-muted-foreground">
                    <Inbox aria-hidden="true" focusable="false" size={20} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No conversations found</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {conversationSearch ? 'Try a different client search.' : 'Client conversations will appear here.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className={isAdminVariant ? 'min-h-0 flex-1 space-y-2 overflow-y-auto p-3' : 'space-y-0.5 p-1'}>
                {visibleConversations.map(conv => {
                  const isSelected = selectedConversationId === conv.id;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        if (selectedConversationId === conv.id) return;
                        setSelectedConversationId(conv.id);
                      }}
                      className={
                        isAdminVariant
                          ? [
                              'group flex w-full items-center gap-3 rounded-[20px] border p-3 text-left transition-all',
                              isSelected
                                ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent-translucent)] shadow-[0_18px_44px_rgba(0,0,0,0.20)]'
                                : 'border-white/10 bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.055]',
                            ].join(' ')
                          : 'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-bg-alt)]'
                      }
                      style={
                        isAdminVariant
                          ? undefined
                          : {
                              background: isSelected ? 'var(--color-accent-muted)' : 'transparent',
                              borderLeft: isSelected ? '3px solid var(--color-accent)' : '3px solid transparent',
                            }
                      }
                    >
                      <div
                        className={
                          isAdminVariant
                            ? 'grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-[var(--color-accent)]'
                            : 'h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold'
                        }
                        style={{
                          background: isAdminVariant ? undefined : 'var(--color-bg-alt)',
                          color: isAdminVariant ? undefined : 'var(--color-accent)',
                          border: isAdminVariant ? undefined : '1px solid var(--color-border)',
                        }}
                      >
                        {getInitials(conv.clientName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground" style={{ color: isAdminVariant ? undefined : 'var(--color-text)' }}>
                            {conv.clientName}
                          </p>
                          {conv.lastMessageAt ? (
                            <span className="flex-shrink-0 text-[10px] text-muted-foreground" style={{ color: isAdminVariant ? undefined : 'var(--color-text-muted)' }}>
                              {formatRelativeTime(conv.lastMessageAt)}
                            </span>
                          ) : null}
                        </div>

                        {conv.unreadCount > 0 ? (
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[9px] font-bold text-[var(--color-text-on-accent)]"
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

        {!hideConversationList && !isAdminVariant ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize conversation list"
            onMouseDown={startDrag}
            className={`hidden w-1 cursor-col-resize md:block ${isDragging ? 'bg-[var(--color-accent)]' : 'bg-transparent'}`}
          />
        ) : null}

        <section className={isAdminVariant ? 'flex min-h-0 flex-1 flex-col bg-black/10' : 'flex min-h-0 flex-1 flex-col'}>
          <div
            className={
              isAdminVariant
                ? 'flex min-h-[78px] items-center gap-3 border-b border-white/10 bg-zinc-950/70 px-5 py-4 backdrop-blur-xl'
                : 'flex items-center gap-3 border-b px-4 py-3 backdrop-blur-xl'
            }
            style={{
              borderColor: isAdminVariant ? undefined : 'var(--color-border)',
              background:
                isAdminVariant
                  ? undefined
                  : 'linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, transparent), color-mix(in srgb, var(--color-surface) 88%, transparent))',
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
                <ArrowLeft aria-hidden="true" focusable="false" size={20} />
              </button>
            ) : null}

            {!hideConversationList ? (
              selectedConversation ? (
                <div className="flex min-w-0 items-center gap-3">
                  {isAdminVariant ? (
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-[var(--color-accent)]">
                      {getInitials(selectedConversation.clientName)}
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground" style={{ color: isAdminVariant ? undefined : 'var(--color-text)' }}>
                      {selectedConversation.clientName}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {isActive ? (
                        <span className="inline-flex flex-shrink-0 items-center gap-1.5">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                          <span className="text-xs text-muted-foreground" style={{ color: isAdminVariant ? undefined : 'var(--color-text-muted)' }}>
                            Active now
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Client conversation</span>
                      )}
                      {selectedConversation.lastMessageAt ? (
                        <span className="text-xs text-muted-foreground">
                          Last message {formatRelativeTime(selectedConversation.lastMessageAt)} ago
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {isAdminVariant && selectedConversation.unreadCount > 0 ? (
                    <span className="ml-auto rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-on-accent)]">
                      {selectedConversation.unreadCount} unread
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  {isAdminVariant ? (
                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <MessageSquare aria-hidden="true" focusable="false" size={18} />
                    </div>
                  ) : null}
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: isAdminVariant ? undefined : 'var(--color-text-muted)' }}
                  >
                    Select a conversation
                  </p>
                </div>
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
            className={isAdminVariant ? 'flex-1 overflow-y-auto px-5 pb-8 pt-5' : 'flex-1 overflow-y-auto px-3 pb-8 pt-4 md:px-4'}
            style={{
              background:
                isAdminVariant
                  ? 'radial-gradient(circle at top, color-mix(in srgb, var(--color-accent) 7%, transparent), transparent 36%), rgba(5,5,7,0.35)'
                  : 'radial-gradient(circle at top, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 38%), var(--color-bg)',
            }}
          >
            {!selectedConversationId && isAdminVariant ? (
              <div className="flex min-h-full items-center justify-center px-6 text-center">
                <div className="max-w-sm rounded-[28px] border border-white/10 bg-white/[0.035] px-6 py-7 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--color-accent)]">
                    <UserRound aria-hidden="true" focusable="false" size={22} />
                  </div>
                  <p className="text-base font-semibold text-foreground">Choose a client conversation</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Select someone from the inbox to review messages and reply from the composer.
                  </p>
                </div>
              </div>
            ) : showMessageSkeleton ? (
              <MessageSkeleton />
            ) : (
              <div ref={messageContentRef} className="min-h-full">
                <MessageList conversation={conversation} messages={messages} onRetryAction={retryMessage} />
                <div ref={bottomRef} className="h-3" />
              </div>
            )}
          </div>

          <div
            className={isAdminVariant ? 'border-t border-white/10 bg-zinc-950/72 px-4 pt-3 backdrop-blur-xl' : 'border-t px-2 pt-2'}
            style={{
              borderColor: isAdminVariant ? undefined : 'var(--color-border)',
              background:
                isAdminVariant
                  ? undefined
                  : 'linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 92%, transparent), var(--color-surface))',
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
