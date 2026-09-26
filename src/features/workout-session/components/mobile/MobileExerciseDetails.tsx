'use client';

import { useState } from 'react';
import { ChatTextIcon as MessageSquare, CaretDownIcon as ChevronDown } from '@phosphor-icons/react';
import type { WorkoutPlanExercise } from '@/features/workout-plans/types/workoutPlan.types';

interface Props {
  exercise: WorkoutPlanExercise;
  isTransitioning: boolean;
}

function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default function MobileExerciseDetails({ exercise, isTransitioning }: Props) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const muscleGroups = exercise.video.muscleGroups;

  return (
    <div
      className="px-5 pt-5 pb-4 transition-all duration-300"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(8px)' : 'translateY(0)',
      }}
    >
      {/* Title */}
      <h2 className="text-2xl font-bold text-foreground tracking-tight leading-tight">
        {exercise.video.title}
      </h2>

      {/* Stats row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium text-foreground">
          {exercise.targetSets} sets
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium text-foreground">
          {exercise.minReps}–{exercise.maxReps} reps
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium text-foreground">
          {formatRest(exercise.restSeconds)} rest
        </span>
      </div>

      {/* Muscle groups */}
      {muscleGroups && (
        <p className="mt-3 text-sm text-muted-foreground">
          {muscleGroups}
        </p>
      )}

      {/* Notes (collapsible) */}
      {exercise.notes && (
        <button
          onClick={() => setNotesExpanded(v => !v)}
          className="mt-3 w-full text-left p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="flex items-start gap-2">
            <MessageSquare size={14} className="mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">Coach notes</p>
                <ChevronDown
                  size={14}
                  className="text-muted-foreground transition-transform duration-200"
                  style={{ transform: notesExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </div>
              <p
                className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: notesExpanded ? 'unset' : 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: notesExpanded ? 'visible' : 'hidden',
                }}
              >
                {exercise.notes}
              </p>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
