import { ChefHatIcon as ChefHat, XIcon as X } from '@phosphor-icons/react/ssr';

interface AddMealModalHeaderProps {
  handleClose: () => void;
}

export function AddMealModalHeader({ handleClose }: AddMealModalHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/92 px-6 py-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--color-accent)]/25 bg-[var(--color-accent-muted)] text-[var(--color-accent)]">
            <ChefHat size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Manual meal
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground">Add New Meal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a structured meal with nutrition, ingredients, tags, and image.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
