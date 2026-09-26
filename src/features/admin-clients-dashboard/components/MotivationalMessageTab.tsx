'use client';

import { ChatTextIcon as MessageSquare } from '@phosphor-icons/react';
import { useClientMotivationalMessage } from '@/features/admin-clients-dashboard/hooks/useClientMotivationalMessage';

export function MotivationalMessageTab({
  clientId,
  clientName,
  currentMessage,
  onRefreshAction,
}: {
  clientId: string;
  clientName: string;
  currentMessage: string | null | undefined;
  onRefreshAction: () => void;
}) {
  const { draft, setDraft, save, isSaving, error, saved } = useClientMotivationalMessage(clientId, currentMessage);

  async function handleSave() {
    await save();
    onRefreshAction();
  }

  return (
    <div
      className="mx-auto max-w-2xl rounded-2xl border p-6 shadow-sm"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-2xl"
          style={{ background: 'var(--color-accent-muted)' }}
        >
          <MessageSquare size={16} style={{ color: 'var(--color-accent)' }} />
        </div>
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Motivational Message
          </h3>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Appears on {clientName}&apos;s dashboard.
          </p>
        </div>
      </div>

      {currentMessage ? (
        <div
          className="mb-5 rounded-xl border px-4 py-3"
          style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
        >
          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Current message
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
            {currentMessage}
          </p>
        </div>
      ) : (
        <p className="mb-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No message set yet. Write one below.
        </p>
      )}

      <label
        className="mb-2 block text-sm font-medium"
        style={{ color: 'var(--color-text)' }}
        htmlFor="motivational-message-textarea"
      >
        {currentMessage ? 'Update message' : 'Write a message'}
      </label>
      <textarea
        id="motivational-message-textarea"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={6}
        placeholder="Write something motivational for your client..."
        className="w-full resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
        style={{
          background: 'var(--color-bg-alt)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      />
      <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {draft.length} characters
      </p>

      {error && (
        <p className="mt-2 text-xs" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="mt-2 text-xs" style={{ color: 'var(--color-success, #22c55e)' }}>
          Message saved successfully.
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving || !draft.trim()}
          className="rounded-xl px-5 py-2 text-sm font-medium transition-opacity"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-text-on-accent)',
            opacity: isSaving || !draft.trim() ? 0.5 : 1,
          }}
        >
          {isSaving ? 'Saving…' : 'Save Message'}
        </button>
      </div>
    </div>
  );
}
