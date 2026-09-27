'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellIcon, CheckIcon, CircleNotchIcon } from '@phosphor-icons/react';
import type { NotificationRecord } from '../types/notification.types';

type NotificationBellProps = {
  items: NotificationRecord[];
  unreadCount: number;
  isLoading: boolean;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function NotificationBell({
  items,
  unreadCount,
  isLoading,
  onMarkRead,
  onMarkAllRead,
}: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  const openNotification = async (notification: NotificationRecord) => {
    if (!notification.readAt) await onMarkRead(notification.id);
    setOpen(false);
    if (notification.actionUrl) router.push(notification.actionUrl);
  };

  const markAll = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      await onMarkAllRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/70 text-muted-foreground transition-colors hover:text-foreground"
      >
        <BellIcon size={18} weight={unreadCount > 0 ? 'fill' : 'regular'} aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm min-w-0 overflow-hidden rounded-3xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl sm:w-[min(22rem,calc(100vw-2rem))]">
          <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
              </p>
            </div>
            <button
              type="button"
              onClick={markAll}
              disabled={isMarkingAll || unreadCount === 0}
              className="shrink-0 text-xs font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isMarkingAll ? 'Saving…' : 'Mark all read'}
            </button>
          </div>

          <div className="max-h-[min(32rem,70vh)] overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                <CircleNotchIcon className="animate-spin" size={18} /> Loading notifications…
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet.</div>
            ) : (
              items.map(notification => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void openNotification(notification)}
                  className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.readAt ? 'bg-border' : 'bg-primary'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className={`min-w-0 break-words [overflow-wrap:anywhere] text-sm ${notification.readAt ? 'font-medium' : 'font-semibold'} text-foreground`}>
                        {notification.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{formatDate(notification.createdAt)}</span>
                    </span>
                    <span className="mt-1 block break-words text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]">{notification.body}</span>
                  </span>
                  {notification.readAt ? <CheckIcon size={14} className="mt-1 shrink-0 text-muted-foreground" /> : null}
                </button>
              ))
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
