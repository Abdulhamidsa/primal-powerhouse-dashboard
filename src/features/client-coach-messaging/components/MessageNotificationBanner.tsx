'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import { useMessageNotifications } from '@/features/client-coach-messaging/hooks/useMessageNotifications';
import type { MessageNotification } from '@/features/client-coach-messaging/types/messaging.types';

const AUTO_DISMISS_MS = 5000;

function NotificationCard({
  notification,
  chatPath,
  onDismiss,
}: {
  notification: MessageNotification;
  chatPath: string;
  onDismiss: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleClick = () => {
    router.push(`${chatPath}?conversationId=${notification.conversationId}`);
    onDismiss();
  };

  const bodyText = notification.preview ?? (notification.hasAttachment ? 'Sent an attachment' : 'New message');

  return (
    <div
      role="alert"
      className="flex w-72 cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg transition-opacity"
      onClick={handleClick}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
        <MessageCircle className="h-4 w-4 text-[var(--color-accent)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--color-text)]">{notification.senderName}</p>
        <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">{bodyText}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        onClick={e => {
          e.stopPropagation();
          onDismiss();
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface MessageNotificationBannerProps {
  userId: string;
  chatPath: string;
}

export default function MessageNotificationBanner({ userId, chatPath }: MessageNotificationBannerProps) {
  const { notifications, dismiss } = useMessageNotifications(userId);

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2"
      aria-live="polite"
      aria-label="Message notifications"
    >
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          chatPath={chatPath}
          onDismiss={() => dismiss(notification.id)}
        />
      ))}
    </div>
  );
}
