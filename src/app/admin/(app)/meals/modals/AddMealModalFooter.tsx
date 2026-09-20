// components/admin/meals/AddMealModalFooter.tsx
interface AddMealModalFooterProps {
  loading: boolean;
  handleClose: () => void;
}

export function AddMealModalFooter({ loading, handleClose }: AddMealModalFooterProps) {
  return (
    <div className="sticky bottom-0 -mx-6 flex gap-3 border-t border-white/10 bg-zinc-950/92 px-6 py-5 backdrop-blur-xl">
      <button
        type="button"
        onClick={handleClose}
        className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="flex-1 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-text-on-accent)] shadow-[0_16px_36px_rgba(0,0,0,0.24)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Meal'}
      </button>
    </div>
  );
}
