'use client';

import { PlusIcon as Plus, MinusIcon as Minus, CheckIcon as Check } from '@phosphor-icons/react';
import type { WorkoutPlanExercise } from '@/features/workout-plans/types/workoutPlan.types';
import type { LocalExerciseState, LocalSetEntry } from '../../types/workoutSession.types';

interface Props {
  state: LocalExerciseState;
  exercise: WorkoutPlanExercise;
  currentIdx: number;
  onUpdateSet: (exerciseIdx: number, setIdx: number, updated: Partial<LocalSetEntry>) => void;
  onAddSet: (exerciseIdx: number) => void;
  onRemoveSet: (exerciseIdx: number) => void;
  isTransitioning: boolean;
}

export default function MobileExerciseSetsForm({
  state,
  exercise,
  currentIdx,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  isTransitioning,
}: Props) {
  return (
    <div
      className="mx-4 rounded-[28px] border border-border bg-card p-4 transition-all duration-300"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
      }}
    >
      {/* Section title */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Sets</h3>
        <span className="text-xs text-muted-foreground">
          {state.sets.filter(s => s.completed).length} / {state.sets.length} done
        </span>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-2 px-1 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Set</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
          Reps
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
          Weight (kg)
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
          Done
        </span>
      </div>

      {/* Sets list */}
      <div className="divide-y divide-border">
        {state.sets.map((set, si) => (
          <SetRow key={si} index={si} set={set} onUpdate={updated => onUpdateSet(currentIdx, si, updated)} />
        ))}
      </div>

      {/* Add/remove set buttons */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAddSet(currentIdx)}
          className="min-h-11 flex-1 rounded-xl bg-muted/60 px-3 text-xs font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98]"
        >
          <Plus aria-hidden="true" focusable="false" size={14} /> Add set
        </button>
        {state.sets.length > exercise.targetSets && (
          <button
            type="button"
            onClick={() => onRemoveSet(currentIdx)}
            className="min-h-11 flex-1 rounded-xl bg-muted/60 px-3 text-xs font-medium text-muted-foreground transition-all hover:bg-muted active:scale-[0.98]"
          >
            <Minus aria-hidden="true" focusable="false" size={14} /> Remove last
          </button>
        )}
      </div>
    </div>
  );
}

function SetRow({
  index,
  set,
  onUpdate,
}: {
  index: number;
  set: LocalSetEntry;
  onUpdate: (updated: Partial<LocalSetEntry>) => void;
}) {
  return (
    <div
      className="grid min-h-[60px] grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-2 py-2 transition-all duration-200"
      style={{ opacity: set.completed ? 1 : 0.85 }}
    >
      {/* Set number */}
      <div className="flex items-center justify-center">
        <span className="text-sm font-semibold text-muted-foreground tabular-nums">{index + 1}</span>
      </div>

      {/* Reps stepper */}
      <Stepper value={set.reps} step={1} min={0} onChange={v => onUpdate({ reps: v })} />

      {/* Weight stepper */}
      <Stepper value={set.weightKg} step={2.5} min={0} decimals={1} onChange={v => onUpdate({ weightKg: v })} />

      {/* Done toggle */}
      <button
        type="button"
        onClick={() => onUpdate({ completed: !set.completed })}
        className="flex min-h-11 min-w-11 items-center justify-center transition-transform active:scale-90"
        aria-label={set.completed ? 'Mark set incomplete' : 'Mark set complete'}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200"
          style={{
            background: set.completed ? 'var(--color-accent)' : 'transparent',
            border: `2px solid ${set.completed ? 'var(--color-accent)' : 'var(--color-border)'}`,
          }}
        >
          {set.completed && (
            <Check aria-hidden="true" focusable="false" size={16} className="text-white" weight="bold" />
          )}
        </div>
      </button>
    </div>
  );
}

function Stepper({
  value,
  step,
  min = 0,
  decimals = 0,
  onChange,
}: {
  value: number;
  step: number;
  min?: number;
  decimals?: number;
  onChange: (v: number) => void;
}) {
  const formatted = decimals > 0 ? value.toFixed(value % 1 === 0 ? 0 : decimals) : value.toString();

  return (
    <div className="flex min-h-11 items-center rounded-xl border border-transparent bg-muted/60 transition-colors focus-within:border-accent">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex h-11 w-10 flex-shrink-0 items-center justify-center text-muted-foreground transition-transform active:scale-90"
        aria-label="Decrease"
      >
        <Minus aria-hidden="true" focusable="false" size={14} />
      </button>
      <input
        type="text"
        inputMode="decimal"
        value={formatted}
        onChange={e => {
          const num = Number(e.target.value);
          if (!isNaN(num)) onChange(Math.max(min, num));
        }}
        className="h-11 w-full min-w-0 bg-transparent text-center text-sm font-semibold tabular-nums text-foreground outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + step)}
        className="flex h-11 w-10 flex-shrink-0 items-center justify-center text-muted-foreground transition-transform active:scale-90"
        aria-label="Increase"
      >
        <Plus aria-hidden="true" focusable="false" size={14} />
      </button>
    </div>
  );
}
