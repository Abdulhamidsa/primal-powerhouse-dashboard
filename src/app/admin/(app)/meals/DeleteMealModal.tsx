import React from 'react';
import { TrashIcon as Trash2, XIcon as X } from '@phosphor-icons/react/ssr';

type DeleteMealModalProps = {
  isOpen: boolean;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const DeleteMealModal = ({ isOpen, deleting, onCancel, onConfirm }: DeleteMealModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-4 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-red-500/20 bg-zinc-950/95 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-300">
                <Trash2 aria-hidden="true" focusable="false" size={20} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-300">Danger zone</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground">Delete meal?</h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              aria-label="Close"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X aria-hidden="true" focusable="false" size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-muted-foreground">
            Are you sure you want to delete this meal? This action cannot be undone and the meal will no longer be
            available from this library.
          </p>
        </div>

        <div className="flex gap-3 border-t border-white/10 bg-white/[0.025] px-6 py-5">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(239,68,68,0.18)] transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 aria-hidden="true" focusable="false" className="h-4 w-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
