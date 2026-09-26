import { useEffect, useRef } from 'react';
import { ArrowLeftIcon as ArrowLeft, PaperPlaneRightIcon as SendHorizontal } from '@phosphor-icons/react/ssr';
import type { ClientNoteEntry } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';

export function ClientNotesPane({
  clientName,
  entries,
  draft,
  error,
  isSaving,
  onDraftChangeAction,
  onBackAction,
  onAddNoteAction,
  showBackButton = true,
}: {
  clientName: string;
  entries: ClientNoteEntry[];
  draft: string;
  error: string | null;
  isSaving: boolean;
  onDraftChangeAction: (value: string) => void;
  onBackAction: () => void;
  onAddNoteAction: () => Promise<void>;
  showBackButton?: boolean;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [entries.length]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onAddNoteAction();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {showBackButton ? (
          <button
            type="button"
            onClick={onBackAction}
            className="inline-flex items-center gap-2 text-xs mb-3"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ArrowLeft size={14} />
            Back to clients
          </button>
        ) : null}
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {clientName} Notes
        </h2>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{ background: 'var(--color-bg-alt)' }}>
        {entries.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            No notes yet. Add the first update for this client.
          </p>
        ) : (
          entries.map(entry => (
            <div
              key={entry.id}
              className="rounded-xl border p-2"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--color-text)' }}>
                  {entry.actor}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {entry.timestampLabel}
                </span>
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                {entry.message}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={onSubmit} className="p-3 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        <textarea
          value={draft}
          onChange={event => onDraftChangeAction(event.target.value)}
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
          placeholder="Add a note"
        />

        {error ? (
          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving || !draft.trim()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-text-on-accent)',
            opacity: isSaving || !draft.trim() ? 0.6 : 1,
          }}
        >
          <SendHorizontal size={14} />
          {isSaving ? 'Saving...' : 'Add Note'}
        </button>
      </form>
    </div>
  );
}
