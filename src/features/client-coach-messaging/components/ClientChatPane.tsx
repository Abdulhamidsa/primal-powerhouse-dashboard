'use client';

import { ArrowLeft, NotebookText } from 'lucide-react';
import { ClientScopedChatPanel } from '@/features/client-coach-messaging/components/ClientScopedChatPanel';
import { useConversationClientPresence } from '@/features/client-coach-messaging/hooks/useConversationClientPresence';

export function ClientChatPane({
  clientId,
  clientName,
  onBackAction,
  onOpenNotesAction,
  showBackButton = true,
}: {
  clientId: string;
  clientName: string;
  onBackAction: () => void;
  onOpenNotesAction: () => void;
  showBackButton?: boolean;
}) {
  const { isActive } = useConversationClientPresence(clientId);
  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4" style={{ borderColor: 'var(--color-border)' }}>
        {showBackButton ? (
          <button
            type="button"
            onClick={onBackAction}
            className="mb-3 inline-flex items-center gap-2 text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ArrowLeft size={14} />
            Back to clients
          </button>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              {clientName} Chat
            </h2>
            {isActive ? (
              <span className="inline-flex items-center gap-1 flex-shrink-0">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Active now
                </span>
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onOpenNotesAction}
            className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            <NotebookText size={14} />
            Notes
          </button>
        </div>
      </div>

      <ClientScopedChatPanel clientId={clientId} />
    </div>
  );
}
