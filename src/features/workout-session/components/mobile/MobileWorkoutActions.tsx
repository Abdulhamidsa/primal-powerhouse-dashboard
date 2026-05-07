'use client';

import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface Props {
  onDone: () => void;
  onPrev: () => void;
  onNext: () => void;
  isDone: boolean;
  isLastExercise: boolean;
  isFinishing: boolean;
  allDone: boolean;
  canFinish: boolean;
  onFinish: () => void;
}

export default function MobileWorkoutActions({
  onDone,
  onPrev,
  onNext,
  isDone,
  isLastExercise,
  isFinishing,
  allDone,
  canFinish,
  onFinish,
}: Props) {
  return (
    <div
      className="px-5 pt-3 pb-6 space-y-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
    >
      {/* Primary action: Done with exercise */}
      {!isDone && (
        <button
          onClick={onDone}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-sm"
          style={{ background: 'var(--color-accent)' }}
        >
          <Check size={18} strokeWidth={3} />
          Done with this exercise
        </button>
      )}

      {/* Navigation row */}
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          className="flex-1 py-3 rounded-2xl text-sm font-medium border border-border bg-background flex items-center justify-center gap-1.5 text-foreground active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {canFinish && isLastExercise ? (
          <button
            onClick={onFinish}
            disabled={isFinishing}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm"
            style={{ background: 'var(--color-accent)' }}
          >
            {isFinishing ? 'Saving…' : allDone ? 'Finish workout' : 'Finish early'}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={isLastExercise}
            className="flex-1 py-3 rounded-2xl text-sm font-medium border border-border bg-background flex items-center justify-center gap-1.5 text-foreground active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100"
          >
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
