'use client';

import {
  CaretLeftIcon as ChevronLeft,
  CaretRightIcon as ChevronRight,
} from '@phosphor-icons/react';

interface Props {
  onPrev: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  isLastExercise: boolean;
  isFinishing: boolean;
  onFinish: () => void;
}

export default function MobileWorkoutActions({
  onPrev,
  onNext,
  hasPrevious,
  isLastExercise,
  isFinishing,
  onFinish,
}: Props) {
  return (
    <div
      className="sticky bottom-0 z-30 border-t border-border bg-background/95 px-5 pt-3 backdrop-blur"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrevious}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-transform active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
        >
          <ChevronLeft aria-hidden="true" focusable="false" size={16} />
          Previous
        </button>

        {isLastExercise ? (
          <button
            type="button"
            onClick={onFinish}
            disabled={isFinishing}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl px-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-60"
            style={{ background: 'var(--color-accent)' }}
          >
            {isFinishing ? 'Saving…' : 'Finish workout'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[var(--color-accent)] px-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
          >
            Next exercise
            <ChevronRight aria-hidden="true" focusable="false" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
