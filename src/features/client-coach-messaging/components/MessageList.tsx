'use client';

import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ChatMessage } from '@/features/client-coach-messaging/types/messaging.types';

function resolveSenderLabel(role: ChatMessage['senderRole']): string {
  if (role === 'CLIENT') return 'Client';
  if (role === 'COACH') return 'Coach';
  if (role === 'ADMIN') return 'Admin';
  return 'Imported Note';
}

function AttachmentView({ attachment }: { attachment: ChatMessage['attachments'][number] }) {
  if (!attachment.url) {
    return (
      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
        Secured media link unavailable
      </p>
    );
  }

  if (attachment.type === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={attachment.url} alt="Attachment" className="max-h-56 w-full rounded-lg object-cover" />
    );
  }

  if (attachment.type === 'video') {
    return <video src={attachment.url} controls className="max-h-56 w-full rounded-lg" preload="metadata" />;
  }

  return <audio src={attachment.url} controls className="w-full" preload="metadata" />;
}

function isOwnMessage(pathname: string, senderRole: ChatMessage['senderRole']): boolean {
  if (pathname.startsWith('/user')) {
    return senderRole === 'CLIENT';
  }

  return senderRole === 'COACH' || senderRole === 'ADMIN';
}

export function MessageList({
  messages,
  onRetryAction,
}: {
  messages: ChatMessage[];
  onRetryAction?: (messageId: string) => Promise<void>;
}) {
  const pathname = usePathname();

  if (!messages.length) {
    return (
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        No messages yet. Start the conversation.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.map(message => (
        <article
          key={message.id}
          className={`max-w-[86%] rounded-2xl border p-3 shadow-sm ${
            isOwnMessage(pathname, message.senderRole) ? 'self-end' : 'self-start'
          }`}
          style={{
            borderColor:
              message.deliveryStatus === 'failed'
                ? 'color-mix(in srgb, var(--color-danger) 35%, var(--color-border))'
                : 'var(--color-border)',
            background:
              message.deliveryStatus === 'failed'
                ? 'color-mix(in srgb, var(--color-danger) 8%, var(--color-surface))'
                : isOwnMessage(pathname, message.senderRole)
                  ? 'var(--color-accent-muted)'
                  : 'var(--color-surface)',
          }}
        >
          <header className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold" style={{ color: 'var(--color-text)' }}>
              {resolveSenderLabel(message.senderRole)}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
          </header>

          {message.body ? (
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
              {message.body}
            </p>
          ) : null}

          {message.attachments.length > 0 ? (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <AttachmentView key={`${message.id}-${attachment.publicId}-${index}`} attachment={attachment} />
              ))}
            </div>
          ) : null}

          {message.deliveryStatus && isOwnMessage(pathname, message.senderRole) ? (
            <footer className="mt-2 flex items-center justify-end gap-2">
              {message.deliveryStatus === 'pending' ? (
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Sending...
                </span>
              ) : null}

              {message.deliveryStatus === 'failed' ? (
                <>
                  <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-danger)' }}>
                    <AlertTriangle size={12} />
                    Failed
                  </span>
                  {onRetryAction ? (
                    <button
                      type="button"
                      onClick={() => void onRetryAction(message.id)}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]"
                      style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                    >
                      <RotateCcw size={11} />
                      Retry
                    </button>
                  ) : null}
                </>
              ) : null}
            </footer>
          ) : null}
        </article>
      ))}
    </div>
  );
}
