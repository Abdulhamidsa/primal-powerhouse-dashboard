'use client';

import { ArrowLeft, NotebookText } from 'lucide-react';
import { ClientScopedChatPanel } from '@/features/client-coach-messaging/components/ClientScopedChatPanel';

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
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {clientName} Chat
          </h2>

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
