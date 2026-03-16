interface AddMealModalHeaderProps {
  handleClose: () => void;
}

export function AddMealModalHeader({ handleClose }: AddMealModalHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-6 py-5 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-foreground">Add New Meal</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Create a structured meal with nutrition, ingredients, tags, and image.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
        >
          <span className="text-xl leading-none">&times;</span>
        </button>
      </div>
    </div>
  );
}
