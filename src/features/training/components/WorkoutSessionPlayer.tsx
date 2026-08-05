'use client';

import { useMemo, useState } from 'react';
import { Dumbbell, Flag, Play, Save, Square } from 'lucide-react';
import type { TrainingSessionDTO } from '@/features/training/types/clientTraining.types';
import {
  useTrainingPreviousPerformance,
  useTrainingSessionActions,
} from '@/features/training/hooks/useTrainingSession';

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function TrainingExerciseCard({
  exercise,
  onSaveSet,
  savingSetId,
}: {
  exercise: TrainingSessionDTO['exercises'][number];
  onSaveSet: (setId: string, formData: FormData) => Promise<void>;
  savingSetId: string | null;
}) {
  const previous = useTrainingPreviousPerformance(exercise.exerciseId ?? undefined);

  return (
    <article className="rounded-3xl border border-border bg-background/70 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{exercise.exerciseNameSnapshot}</p>
          <p className="text-xs text-muted-foreground">
            {exercise.plannedSets} sets · {exercise.plannedReps} reps · {exercise.plannedRestSeconds}s rest
          </p>
        </div>
        {previous.previousPerformance?.sets?.length ? (
          <div className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Previous performance</p>
            <p className="mt-1">
              {previous.previousPerformance.exerciseName} · {previous.previousPerformance.sets.length} completed set
              {previous.previousPerformance.sets.length !== 1 ? 's' : ''}
            </p>
          </div>
        ) : null}
      </div>

      {exercise.notesSnapshot ? <p className="mt-3 text-sm text-muted-foreground">{exercise.notesSnapshot}</p> : null}

      <div className="mt-4 space-y-3">
        {exercise.sets.map(set => (
          <form
            key={set.id}
            onSubmit={async event => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              await onSaveSet(set.id, formData);
            }}
            className="grid gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Set {set.setNumber}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="space-y-1 text-xs text-muted-foreground">
                  <span>Reps</span>
                  <input
                    name="actualReps"
                    defaultValue={set.actualReps ?? ''}
                    type="number"
                    min={0}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  <span>Weight kg</span>
                  <input
                    name="actualWeightKg"
                    defaultValue={set.actualWeightKg ?? ''}
                    type="number"
                    min={0}
                    step="0.5"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  />
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground sm:justify-self-start">
              <input
                name="completed"
                type="checkbox"
                defaultChecked={set.completed}
                className="h-4 w-4 rounded border-border"
              />
              Completed
            </label>

            <button
              type="submit"
              disabled={savingSetId === set.id}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
            >
              <Save size={14} />
              {savingSetId === set.id ? 'Saving' : 'Save set'}
            </button>
          </form>
        ))}
      </div>

      {exercise.sets.some(set => set.completed) ? (
        <p className="mt-3 text-xs text-emerald-600">
          Logged sets will be saved to history when you complete the workout.
        </p>
      ) : null}
    </article>
  );
}

export function WorkoutSessionPlayer({ session, onCompleted }: { session: TrainingSessionDTO; onCompleted?: () => void }) {
  const { updateSet, completeSession } = useTrainingSessionActions();
  const [overallFeedback, setOverallFeedback] = useState('');
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<'EASY' | 'GOOD' | 'HARD' | 'VERY_HARD' | ''>('');
  const [savingSetId, setSavingSetId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const primaryTitle = session.planDay.title ?? session.planDay.workoutTemplate?.name ?? 'Workout session';
  const startedAtLabel = formatDateTime(session.startedAt);
  const isRestDay = session.planDay.type === 'REST';

  const canComplete = useMemo(
    () => session.exercises.every(exercise => exercise.sets.every(set => set.completed || set.skipped)),
    [session.exercises],
  );

  const handleSaveSet = async (setId: string, formData: FormData) => {
    setSavingSetId(setId);
    try {
      const repsValue = formData.get('actualReps');
      const weightValue = formData.get('actualWeightKg');
      const completedValue = formData.get('completed') === 'on';
      await updateSet(session.id, setId, {
        actualReps: repsValue === '' || repsValue == null ? null : Number(repsValue),
        actualWeightKg: weightValue === '' || weightValue == null ? null : Number(weightValue),
        completed: completedValue,
        skipped: false,
      });
    } finally {
      setSavingSetId(null);
    }
  };

  const handleComplete = async (status: 'COMPLETED' | 'ABANDONED') => {
    setCompleting(true);
    try {
      await completeSession(session.id, {
        status,
        perceivedDifficulty: perceivedDifficulty || null,
        overallFeedback: overallFeedback.trim() || null,
        caloriesBurned: null,
      });
      onCompleted?.();
    } finally {
      setCompleting(false);
    }
  };

  if (isRestDay) {
    return (
      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-500">
            <Flag size={18} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Rest day</h3>
            <p className="text-sm text-muted-foreground">No workout is scheduled for today.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Dumbbell size={14} />
            Active session
          </div>
          <h3 className="mt-2 text-xl font-semibold text-foreground">{primaryTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.planDay.note ?? 'Work through the exercises below and log each set.'}
          </p>
          {startedAtLabel ? <p className="mt-2 text-xs text-muted-foreground">Started {startedAtLabel}</p> : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleComplete('ABANDONED')}
            disabled={completing}
            className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
          >
            <Square size={14} />
            Abandon
          </button>
          <button
            type="button"
            onClick={() => handleComplete('COMPLETED')}
            disabled={completing || !canComplete}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Play size={14} />
            Complete
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {session.exercises.map(exercise => (
          <TrainingExerciseCard
            key={exercise.id}
            exercise={exercise}
            savingSetId={savingSetId}
            onSaveSet={handleSaveSet}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-3 rounded-3xl border border-border bg-muted/30 p-4 md:grid-cols-3">
        <label className="space-y-2 md:col-span-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Perceived difficulty
          </span>
          <select
            value={perceivedDifficulty}
            onChange={event => setPerceivedDifficulty(event.target.value as typeof perceivedDifficulty)}
            className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            <option value="">Not set</option>
            <option value="EASY">Easy</option>
            <option value="GOOD">Good</option>
            <option value="HARD">Hard</option>
            <option value="VERY_HARD">Very hard</option>
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overall feedback</span>
          <textarea
            value={overallFeedback}
            onChange={event => setOverallFeedback(event.target.value)}
            rows={3}
            placeholder="How did the session feel?"
            className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
          />
        </label>
      </div>
    </section>
  );
}
