// components/admin/meals/AddMealModalFooter.tsx
interface AddMealModalFooterProps {
  loading: boolean;
  handleClose: () => void;
}

export function AddMealModalFooter({ loading, handleClose }: AddMealModalFooterProps) {
  return (
    <div className="flex gap-3 border-t border-[var(--color-border)] pt-6">
      <button type="button" onClick={handleClose} className="btn-secondary flex-1">
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary flex-1 bg-[var(--color-accent)] text-[var(--color-text-on-accent)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Meal'}
      </button>
    </div>
  );
}
