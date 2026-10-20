// components/admin/meals/AddMealModalFooter.tsx
interface AddMealModalFooterProps {
  loading: boolean;
  handleClose: () => void;
}

export function AddMealModalFooter({ loading, handleClose }: AddMealModalFooterProps) {
  return (
    <div className="sticky bottom-0 -mx-6 flex gap-3 border-t border-white/10 bg-zinc-950 px-6 py-5">
      <button
        type="button"
        onClick={handleClose}
        className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="flex-1 rounded-lg border border-white/20 bg-white px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Meal'}
      </button>
    </div>
  );
}
