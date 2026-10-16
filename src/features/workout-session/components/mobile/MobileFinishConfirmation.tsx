'use client';

interface Props {
  incompleteSetCount: number;
  onReview: () => void;
  onFinish: () => void;
  isLoading: boolean;
}

export default function MobileFinishConfirmation({
  incompleteSetCount,
  onReview,
  onFinish,
  isLoading,
}: Props) {
  return (
    <div className="absolute inset-0 z-50 flex h-screen w-screen items-end justify-center bg-black/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-workout-title"
        className="w-full max-w-md rounded-t-3xl bg-background p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <div className="mb-4 flex justify-center">
          <div className="h-1 w-9 rounded-full bg-muted" />
        </div>

        <h3 id="finish-workout-title" className="text-lg font-bold text-foreground">
          Finish workout early?
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {incompleteSetCount} {incompleteSetCount === 1 ? 'set is' : 'sets are'} still incomplete. Your recorded reps and
          weights will be saved as entered.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onFinish}
            className="min-h-12 w-full rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {isLoading ? 'Saving…' : 'Finish anyway'}
          </button>
          <button
            type="button"
            onClick={onReview}
            className="min-h-12 w-full rounded-2xl bg-muted/60 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
          >
            Review sets
          </button>
        </div>
      </div>
    </div>
  );
}
