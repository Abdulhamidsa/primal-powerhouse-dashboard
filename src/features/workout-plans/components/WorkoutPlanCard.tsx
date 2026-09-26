'use client';

import { BarbellIcon as Dumbbell, TrashIcon as Trash2, PencilSimpleIcon as Edit2, UsersIcon as Users } from '@phosphor-icons/react';
import type { WorkoutPlan } from '../types/workoutPlan.types';
import { useWorkoutPlanActions } from '../hooks/useWorkoutPlans';
import { KeyedMutator } from 'swr';

interface Props {
  plan: WorkoutPlan;
  onEdit: () => void;
  onMutate: KeyedMutator<WorkoutPlan[]>;
}

export default function WorkoutPlanCard({ plan, onEdit, onMutate }: Props) {
  const { remove } = useWorkoutPlanActions();

  async function handleDelete() {
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    await remove(plan.id);
    await onMutate();
  }

  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-3"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Dumbbell aria-hidden="true" focusable="false" size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <span className="font-semibold text-[var(--color-text-primary)] truncate">{plan.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
            title="Edit plan"
          >
            <Edit2 aria-hidden="true" focusable="false" size={15} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
            title="Delete plan"
          >
            <Trash2 aria-hidden="true" focusable="false" size={15} />
          </button>
        </div>
      </div>

      {plan.description && (
        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">{plan.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
        <span>
          {plan.exercises.length} exercise{plan.exercises.length !== 1 ? 's' : ''}
        </span>
        {plan._count !== undefined && (
          <span className="flex items-center gap-1">
            <Users aria-hidden="true" focusable="false" size={12} />
            {plan._count.assignments} assigned
          </span>
        )}
      </div>

      {plan.exercises.length > 0 && (
        <ul className="space-y-1">
          {plan.exercises.slice(0, 4).map((ex, i) => (
            <li key={ex.id} className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5">
              <span className="w-4 text-right shrink-0 font-mono">{i + 1}.</span>
              <span className="truncate">{ex.video.title}</span>
              <span className="shrink-0 ml-auto">
                {ex.targetSets}×{ex.minReps}–{ex.maxReps}
              </span>
            </li>
          ))}
          {plan.exercises.length > 4 && (
            <li className="text-xs text-[var(--color-text-secondary)] pl-5">+{plan.exercises.length - 4} more</li>
          )}
        </ul>
      )}
    </div>
  );
}
