'use client';

import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ChatMessage, ConversationSummary } from '@/features/client-coach-messaging/types/messaging.types';

function getInitials(name: string): string {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || '??';
}

function resolveSenderIdentity(
  role: ChatMessage['senderRole'],
  conversation: ConversationSummary | null,
): { label: string; avatarUrl: string | null; initials: string } {
  if (role === 'CLIENT') {
    const label = conversation?.clientName || 'Client';
    return {
      label,
      avatarUrl: conversation?.clientAvatar ?? null,
      initials: getInitials(label),
    };
  }

  if (role === 'COACH') {
    const label = conversation?.coachName || 'Coach';
    return {
      label,
      avatarUrl: null,
      initials: getInitials(label),
    };
  }

  if (role === 'ADMIN') {
    const label = conversation?.coachName || 'Admin';
    return {
      label,
      avatarUrl: null,
      initials: getInitials(label),
    };
  }

  return {
    label: 'Imported Note',
    avatarUrl: null,
    initials: 'IN',
  };
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
  conversation,
  messages,
  onRetryAction,
}: {
  conversation: ConversationSummary | null;
  messages: ChatMessage[];
  onRetryAction?: (messageId: string) => Promise<void>;
}) {
  const pathname = usePathname();

  if (!messages.length) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 text-center">
        <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-5 py-6 shadow-sm backdrop-blur-xl">
          <p className="text-sm font-semibold text-[var(--color-text)]">No messages yet</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">Start the conversation with your coach.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col justify-end gap-3">
      {messages.map((message, index) => {
        const ownMessage = isOwnMessage(pathname, message.senderRole);
        const sender = resolveSenderIdentity(message.senderRole, conversation);
        const timestampLabel = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
        const isLastMessage = index === messages.length - 1;
        const showStatusRow =
          isLastMessage ||
          (ownMessage && (message.deliveryStatus === 'pending' || message.deliveryStatus === 'failed'));

        return (
          <div key={message.id} className={`flex gap-2 ${ownMessage ? 'justify-end' : 'justify-start'}`}>
            {!ownMessage ? (
              <div className="mt-1 shrink-0">
                {sender.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sender.avatarUrl} alt={sender.label} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div
                    className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold"
                    style={{
                      background: 'color-mix(in srgb, var(--color-accent) 14%, var(--color-surface))',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {sender.initials}
                  </div>
                )}
              </div>
            ) : null}

            <div className={`max-w-[78%] ${ownMessage ? 'items-end' : 'items-start'} flex flex-col`}>
              <article
                className={`w-fit px-4 py-2.5 shadow-sm backdrop-blur-xl ${
                  ownMessage
                    ? 'self-end rounded-[24px] rounded-br-[9px]'
                    : 'self-start rounded-[24px] rounded-bl-[9px]'
                }`}
                style={{
                  border: `1px solid ${message.deliveryStatus === 'failed' ? 'var(--color-danger)' : 'var(--color-border)'}`,
                  background:
                    message.deliveryStatus === 'failed'
                      ? 'var(--color-danger-muted)'
                      : ownMessage
                        ? 'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 70%, var(--color-surface)), color-mix(in srgb, var(--color-accent) 46%, var(--color-surface)))'
                        : 'color-mix(in srgb, var(--color-surface) 92%, var(--color-bg))',
                }}
              >
                {message.body ? (
                  <p
                    className="whitespace-pre-wrap text-[15px] leading-6"
                    style={{ color: ownMessage ? 'var(--color-text-on-accent)' : 'var(--color-text)' }}
                  >
                    {message.body}
                  </p>
                ) : null}

                {message.attachments.length > 0 ? (
                  <div className={message.body ? 'mt-2 space-y-2' : 'space-y-2'}>
                    {message.attachments.map((attachment, index) => (
                      <AttachmentView key={`${message.id}-${attachment.publicId}-${index}`} attachment={attachment} />
                    ))}
                  </div>
                ) : null}
              </article>

              {showStatusRow ? (
                <div className={`mt-1.5 flex items-center gap-2 px-1 ${ownMessage ? 'justify-end' : 'justify-start'}`}>
                  {isLastMessage ? (
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      {timestampLabel}
                    </span>
                  ) : null}

                  {message.deliveryStatus && ownMessage ? (
                    <>
                      {message.deliveryStatus === 'pending' ? (
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          Sending...
                        </span>
                      ) : null}

                      {message.deliveryStatus === 'failed' ? (
                        <>
                          <span
                            className="inline-flex items-center gap-1 text-[10px]"
                            style={{ color: 'var(--color-danger)' }}
                          >
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
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            {ownMessage ? (
              <div className="mt-1 shrink-0">
                {sender.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sender.avatarUrl} alt={sender.label} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div
                    className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold"
                    style={{
                      background: 'color-mix(in srgb, var(--color-text) 10%, transparent)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {sender.initials}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
