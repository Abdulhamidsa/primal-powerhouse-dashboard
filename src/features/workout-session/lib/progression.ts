import type { WorkoutPlanExercise } from '@/features/workout-plans/types/workoutPlan.types';
import type { LocalExerciseState } from '../types/workoutSession.types';

const PROGRESSION_INCREMENT_KG = 2.5;

/**
 * Returns the starting weight suggestion for a given exercise.
 * Priority: last completed set from previous session > suggestedWeightKg > 0
 */
export function getSuggestedWeight(
  exercise: WorkoutPlanExercise,
  lastSessionExercise?: { sets: { weightKg: number; completed: boolean }[] } | null,
): number {
  if (lastSessionExercise?.sets?.length) {
    const completedSets = lastSessionExercise.sets.filter(s => s.completed);
    if (completedSets.length > 0) {
      const maxWeight = Math.max(...completedSets.map(s => s.weightKg));
      return maxWeight + PROGRESSION_INCREMENT_KG;
    }
  }
  return exercise.suggestedWeightKg ?? 0;
}

/**
 * Builds initial blank local state for all exercises in a plan.
 */
export function buildInitialExerciseState(
  exercises: WorkoutPlanExercise[],
  lastSessionMap?: Record<string, { sets: { weightKg: number; completed: boolean }[] } | null>,
): LocalExerciseState[] {
  return exercises.map(ex => {
    const lastEx = lastSessionMap?.[ex.id] ?? null;
    const suggestedWeight = getSuggestedWeight(ex, lastEx);

    return {
      planExerciseId: ex.id,
      sets: Array.from({ length: ex.targetSets }, () => ({
        reps: ex.maxReps,
        weightKg: suggestedWeight,
        completed: true,
      })),
      feedback: null,
      feedbackNote: null,
      done: false,
    };
  });
}
