'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckIcon as Check, CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, BarbellIcon as Dumbbell, FlagIcon as Flag, ImageIcon as ImageIcon, ListChecksIcon as ListChecks, CircleNotchIcon as Loader2, PlayIcon as Play, SquareIcon as Square, XIcon as X } from '@phosphor-icons/react';
import type { TrainingSessionDTO, TrainingSessionSetDTO } from '@/features/training/types/clientTraining.types';
import {
  useTrainingPreviousPerformance,
  useTrainingSessionActions,
} from '@/features/training/hooks/useTrainingSession';

type SetDraft = {
  actualReps: number | null;
  actualWeightKg: number | null;
  completed: boolean;
  skipped: boolean;
};

type DraftMap = Record<string, SetDraft>;

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function isImageUrl(value: string | null | undefined) {
  return Boolean(value?.match(/\.(gif|webp|png|jpe?g|avif)(\?.*)?$/i));
}

function toNumberOrNull(value: string) {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function draftFromSet(set: TrainingSessionSetDTO): SetDraft {
  return {
    actualReps: set.actualReps,
    actualWeightKg: set.actualWeightKg,
    completed: set.completed,
    skipped: set.skipped,
  };
}

function draftsEqual(a: SetDraft, b: SetDraft) {
  return (
    a.actualReps === b.actualReps &&
    a.actualWeightKg === b.actualWeightKg &&
    a.completed === b.completed &&
    a.skipped === b.skipped
  );
}

function buildDrafts(session: TrainingSessionDTO): DraftMap {
  return Object.fromEntries(
    session.exercises.flatMap(exercise => exercise.sets.map(set => [set.id, draftFromSet(set)])),
  );
}

function ExerciseMedia({ exercise }: { exercise: TrainingSessionDTO['exercises'][number] }) {
  const media = exercise.exercise;
  const videoUrl = media?.videoUrl?.trim() || null;
  const imageUrl = media?.imageUrl?.trim() || null;
  const instructions = media?.instructions?.trim() || null;
  const visualUrl = videoUrl || imageUrl;
  const shouldRenderImage = isImageUrl(videoUrl) || (!videoUrl && Boolean(imageUrl));

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <div className="aspect-video w-full bg-muted/40">
        {visualUrl ? (
          shouldRenderImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={visualUrl} alt={`${exercise.exerciseNameSnapshot} demo`} className="h-full w-full object-cover" />
          ) : (
            <video src={visualUrl} controls preload="metadata" className="h-full w-full bg-black object-contain" />
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
            <span className="rounded-full bg-background/70 p-3">
              <ImageIcon size={22} />
            </span>
            <p className="text-sm font-medium">No exercise demo added</p>
            <p className="text-xs">Your coach can add a video or image for this movement.</p>
          </div>
        )}
      </div>
      {instructions ? (
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instructions</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-foreground">{instructions}</p>
        </div>
      ) : null}
    </div>
  );
}

function SetEditor({
  set,
  draft,
  onChange,
}: {
  set: TrainingSessionSetDTO;
  draft: SetDraft;
  onChange: (updates: Partial<SetDraft>) => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">Set {set.setNumber}</p>
        <p className="text-xs text-muted-foreground">
          Target {set.plannedReps} reps{set.plannedRestSeconds ? ` · ${set.plannedRestSeconds}s rest` : ''}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>Reps</span>
          <input
            value={draft.actualReps ?? ''}
            onChange={event => onChange({ actualReps: toNumberOrNull(event.target.value) })}
            type="number"
            min={0}
            inputMode="numeric"
            className="h-12 w-full rounded-2xl border border-border bg-background px-3 text-base text-foreground outline-none transition-colors focus:border-primary"
          />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>Weight kg</span>
          <input
            value={draft.actualWeightKg ?? ''}
            onChange={event => onChange({ actualWeightKg: toNumberOrNull(event.target.value) })}
            type="number"
            min={0}
            step="0.5"
            inputMode="decimal"
            className="h-12 w-full rounded-2xl border border-border bg-background px-3 text-base text-foreground outline-none transition-colors focus:border-primary"
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange({ completed: !draft.completed, skipped: false })}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition-colors ${
            draft.completed
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-border bg-background text-muted-foreground hover:bg-muted/60'
          }`}
        >
          <Check size={15} />
          Done
        </button>
        <button
          type="button"
          onClick={() => onChange({ skipped: !draft.skipped, completed: false })}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition-colors ${
            draft.skipped
              ? 'border-amber-500 bg-amber-500 text-white'
              : 'border-border bg-background text-muted-foreground hover:bg-muted/60'
          }`}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

function ExercisePanel({
  exercise,
  drafts,
  onSetChange,
}: {
  exercise: TrainingSessionDTO['exercises'][number];
  drafts: DraftMap;
  onSetChange: (setId: string, updates: Partial<SetDraft>) => void;
}) {
  const previous = useTrainingPreviousPerformance(exercise.exerciseId ?? undefined);

  return (
    <div className="space-y-4">
      <ExerciseMedia exercise={exercise} />

      <section className="rounded-[28px] border border-border bg-background/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{exercise.exerciseNameSnapshot}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {exercise.plannedSets} sets · {exercise.plannedReps} reps · {exercise.plannedRestSeconds}s rest
            </p>
          </div>
          {previous.previousPerformance?.sets?.length ? (
            <div className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Previous performance</p>
              <p className="mt-1">
                {previous.previousPerformance.sets.length} completed set
                {previous.previousPerformance.sets.length !== 1 ? 's' : ''}
              </p>
            </div>
          ) : null}
        </div>

        {exercise.notesSnapshot ? (
          <div className="mt-4 rounded-2xl border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coach note</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{exercise.notesSnapshot}</p>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {exercise.sets.map(set => (
            <SetEditor
              key={set.id}
              set={set}
              draft={drafts[set.id] ?? draftFromSet(set)}
              onChange={updates => onSetChange(set.id, updates)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export function WorkoutSessionPlayer({
  session,
  onCompleted,
  onClose,
}: {
  session: TrainingSessionDTO;
  onCompleted?: () => void;
  onClose?: () => void;
}) {
  const { updateSet, completeSession } = useTrainingSessionActions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<'EASY' | 'GOOD' | 'HARD' | 'VERY_HARD' | ''>('');
  const [drafts, setDrafts] = useState<DraftMap>(() => buildDrafts(session));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    setDrafts(currentDrafts => {
      const nextDrafts = { ...currentDrafts };
      for (const exercise of session.exercises) {
        for (const set of exercise.sets) {
          if (!nextDrafts[set.id]) nextDrafts[set.id] = draftFromSet(set);
        }
      }
      return nextDrafts;
    });
  }, [session]);

  const primaryTitle = session.planDay.title ?? session.planDay.workoutTemplate?.name ?? 'Workout session';
  const startedAtLabel = formatDateTime(session.startedAt);
  const isRestDay = session.planDay.type === 'REST';
  const activeExercise = session.exercises[activeIndex] ?? session.exercises[0] ?? null;
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < session.exercises.length - 1;

  const dirtySetIds = useMemo(() => {
    const ids: string[] = [];
    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        const draft = drafts[set.id];
        if (draft && !draftsEqual(draft, draftFromSet(set))) ids.push(set.id);
      }
    }
    return ids;
  }, [drafts, session.exercises]);

  const canComplete = useMemo(
    () =>
      session.exercises.every(exercise =>
        exercise.sets.every(set => {
          const draft = drafts[set.id] ?? draftFromSet(set);
          return draft.completed || draft.skipped;
        }),
      ),
    [drafts, session.exercises],
  );

  const setStatuses = useMemo(
    () =>
      session.exercises.map(exercise => {
        const total = exercise.sets.length;
        const done = exercise.sets.filter(set => {
          const draft = drafts[set.id] ?? draftFromSet(set);
          return draft.completed || draft.skipped;
        }).length;
        return { total, done, complete: total > 0 && done === total, started: done > 0 && done < total };
      }),
    [drafts, session.exercises],
  );

  const saveDirtySets = async () => {
    if (dirtySetIds.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const setById = new Map(session.exercises.flatMap(exercise => exercise.sets.map(set => [set.id, set])));
      for (const setId of dirtySetIds) {
        const draft = drafts[setId];
        const original = setById.get(setId);
        if (!draft || !original || draftsEqual(draft, draftFromSet(original))) continue;
        await updateSet(session.id, setId, {
          actualReps: draft.actualReps,
          actualWeightKg: draft.actualWeightKg,
          completed: draft.completed,
          skipped: draft.skipped,
        });
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save your set changes.');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleSetChange = (setId: string, updates: Partial<SetDraft>) => {
    setDrafts(current => ({
      ...current,
      [setId]: {
        ...current[setId],
        ...updates,
      },
    }));
  };

  const moveToExercise = async (index: number) => {
    if (index < 0 || index >= session.exercises.length || index === activeIndex) return;
    await saveDirtySets();
    setActiveIndex(index);
    setShowExerciseList(false);
  };

  const handleClose = async () => {
    await saveDirtySets();
    onClose?.();
  };

  const handleComplete = async (status: 'COMPLETED' | 'ABANDONED') => {
    setCompleting(true);
    try {
      await saveDirtySets();
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

  if (!activeExercise) {
    return (
      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">This workout has no exercises yet.</p>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void handleClose()}
            disabled={saving || completing}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-border px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
            aria-label="Close workout"
          >
            <X size={16} />
            <span className="hidden sm:inline">Leave workout</span>
            <span className="sm:hidden">Leave</span>
          </button>

          <div className="min-w-0 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Dumbbell size={13} />
              Exercise {activeIndex + 1} of {session.exercises.length}
            </div>
            <h1 className="mt-1 truncate text-base font-semibold text-foreground">{primaryTitle}</h1>
          </div>

          <button
            type="button"
            onClick={() => setShowExerciseList(value => !value)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/60"
            aria-label="Show exercise list"
          >
            <ListChecks size={18} />
          </button>
        </div>

        <div className="mx-auto mt-3 max-w-3xl">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((activeIndex + 1) / session.exercises.length) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{startedAtLabel ? `Started ${startedAtLabel}` : 'Active session'}</span>
            <span>{saving ? 'Saving...' : dirtySetIds.length ? 'Unsaved changes' : 'Saved'}</span>
          </div>
        </div>
      </header>

      {showExerciseList ? (
        <div className="border-b border-border bg-card px-4 py-3">
          <div className="mx-auto grid max-w-3xl gap-2 sm:grid-cols-2">
            {session.exercises.map((exercise, index) => {
              const status = setStatuses[index];
              return (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => void moveToExercise(index)}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition-colors ${
                    index === activeIndex ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted/60'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {index + 1}. {exercise.exerciseNameSnapshot}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {status.done}/{status.total} sets
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                      status.complete
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : status.started
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {status.complete ? 'Done' : status.started ? 'Started' : 'New'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">
        {saveError ? (
          <p className="mb-3 rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{saveError}</p>
        ) : null}

        <ExercisePanel exercise={activeExercise} drafts={drafts} onSetChange={handleSetChange} />

        {activeIndex === session.exercises.length - 1 ? (
          <div className="mt-4 grid gap-3 rounded-[28px] border border-border bg-card p-4">
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Perceived difficulty
              </span>
              <select
                value={perceivedDifficulty}
                onChange={event => setPerceivedDifficulty(event.target.value as typeof perceivedDifficulty)}
                className="h-12 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
              >
                <option value="">Not set</option>
                <option value="EASY">Easy</option>
                <option value="GOOD">Good</option>
                <option value="HARD">Hard</option>
                <option value="VERY_HARD">Very hard</option>
              </select>
            </label>

            <label className="space-y-2">
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
        ) : null}
      </main>

      <footer className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => void moveToExercise(activeIndex - 1)}
            disabled={!hasPrevious || saving || completing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <button
            type="button"
            onClick={() => void moveToExercise(activeIndex + 1)}
            disabled={!hasNext || saving || completing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
          >
            Next
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => void handleComplete('ABANDONED')}
            disabled={saving || completing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
          >
            <Square size={15} />
            Abandon
          </button>
          <button
            type="button"
            onClick={() => void handleComplete('COMPLETED')}
            disabled={saving || completing || !canComplete}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {completing ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            Complete
          </button>
        </div>
      </footer>
    </section>
  );
}
