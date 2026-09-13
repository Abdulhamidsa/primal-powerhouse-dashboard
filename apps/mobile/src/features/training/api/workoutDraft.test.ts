import { expect, it } from 'vitest';
import { restSecondsRemaining, updateWorkoutSet } from './workoutDraft';
import type { LegacyDraft } from '../types/training.types';

it('calculates rest from wall-clock time across backgrounding and reopening', () => {
  const deadline = 120_000;
  expect(restSecondsRemaining(deadline, 0)).toBe(120);
  expect(restSecondsRemaining(deadline, 90_200)).toBe(30);
  expect(restSecondsRemaining(deadline, 300_000)).toBe(0);
  expect(restSecondsRemaining(Number.NaN, 0)).toBe(0);
});

it('marks an exercise complete only when every set is done, and clears completion on undo', () => {
  const initial: LegacyDraft = {
    sessionId: 'session',
    logs: {
      exercise: {
        planExerciseId: 'exercise',
        completedAt: null,
        feedback: null,
        feedbackNote: 'Keep me',
        sets: [
          { reps: 8, weightKg: 20, completed: false },
          { reps: 8, weightKg: 20, completed: false },
        ],
      },
    },
  };
  const first = updateWorkoutSet(initial, 'exercise', 0, { completed: true }, 1000);
  expect(first.logs.exercise.completedAt).toBeNull();
  const completed = updateWorkoutSet(first, 'exercise', 1, { completed: true }, 2000);
  expect(completed.logs.exercise.completedAt).toBe(new Date(2000).toISOString());
  const undone = updateWorkoutSet(completed, 'exercise', 0, { completed: false }, 3000);
  expect(undone.logs.exercise.completedAt).toBeNull();
  expect(undone.logs.exercise.feedbackNote).toBe('Keep me');
  expect(initial.logs.exercise.sets[0].completed).toBe(false);
});
