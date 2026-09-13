import type { LegacyDraft } from '../types/training.types';

export function restSecondsRemaining(deadline: number, now: number) {
  return Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
}

export function updateWorkoutSet(
  draft: LegacyDraft,
  exerciseId: string,
  index: number,
  patch: Partial<LegacyDraft['logs'][string]['sets'][number]>,
  now: number,
) {
  const exercise = draft.logs[exerciseId];
  if (!exercise?.sets[index]) return draft;
  const sets = exercise.sets.map((set, i) => (i === index ? { ...set, ...patch } : set));
  return {
    ...draft,
    logs: {
      ...draft.logs,
      [exerciseId]: {
        ...exercise,
        sets,
        completedAt: sets.every(set => set.completed) ? (exercise.completedAt ?? new Date(now).toISOString()) : null,
      },
    },
  };
}
