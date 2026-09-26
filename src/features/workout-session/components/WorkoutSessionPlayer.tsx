'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon as ArrowLeft, CheckCircleIcon as CheckCircle2, CaretRightIcon as ChevronRight, CaretLeftIcon as ChevronLeft, PlusIcon as Plus, MinusIcon as Minus, TimerIcon as Timer, ChatTextIcon as MessageSquare } from '@phosphor-icons/react';
import type { WorkoutPlanAssignmentWithPlan } from '@/features/workout-plans/types/workoutPlan.types';
import type { LocalExerciseState, LocalSetEntry, ExerciseFeedbackType } from '../types/workoutSession.types';
import { buildInitialExerciseState } from '../lib/progression';
import { startWorkoutSession, completeWorkoutSession } from '../api/workoutSession.api';

const FEEDBACK_OPTIONS: { value: ExerciseFeedbackType; label: string }[] = [
  { value: 'TOO_EASY', label: 'Too easy' },
  { value: 'FELT_GOOD', label: 'Felt good' },
  { value: 'TOO_HEAVY', label: 'Too heavy' },
  { value: 'FORM_ISSUE', label: 'Form issue' },
  { value: 'PAIN_DISCOMFORT', label: 'Pain / discomfort' },
];

interface Props {
  assignment: WorkoutPlanAssignmentWithPlan;
  onDone: () => void;
}

export default function WorkoutSessionPlayer({ assignment, onDone }: Props) {
  const exercises = assignment.workoutPlan.exercises;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [exerciseStates, setExerciseStates] = useState<LocalExerciseState[]>(() =>
    buildInitialExerciseState(exercises),
  );
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentExercise = exercises[currentIdx];
  const currentState = exerciseStates[currentIdx];

  // Start session on mount
  useEffect(() => {
    startWorkoutSession(assignment.id)
      .then(s => {
        setSessionId(s.id);
        setStarted(true);
      })
      .catch((error: any) => {
        if (error?.status === 409 && /already trained/i.test(String(error?.message ?? ''))) {
          setIsLocked(true);
          setLockMessage(String(error.message));
        }
        setStarted(true); /* offline fallback or completed lock */
      });
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assignment.id]);

  // Rest timer
  useEffect(() => {
    if (restSeconds === null) return;
    if (restSeconds <= 0) {
      setRestSeconds(null);
      return;
    }
    timerRef.current = setInterval(() => setRestSeconds(s => (s !== null && s > 0 ? s - 1 : null)), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [restSeconds]);

  function updateSet(exerciseIdx: number, setIdx: number, updated: Partial<LocalSetEntry>) {
    setExerciseStates(prev =>
      prev.map((ex, i) =>
        i !== exerciseIdx ? ex : { ...ex, sets: ex.sets.map((s, si) => (si === setIdx ? { ...s, ...updated } : s)) },
      ),
    );
  }

  function addSet(exerciseIdx: number) {
    setExerciseStates(prev =>
      prev.map((ex, i) => {
        if (i !== exerciseIdx) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { reps: last?.reps ?? exercises[i].maxReps, weightKg: last?.weightKg ?? 0, completed: true },
          ],
        };
      }),
    );
  }

  function removeSet(exerciseIdx: number) {
    setExerciseStates(prev =>
      prev.map((ex, i) => {
        if (i !== exerciseIdx || ex.sets.length <= 1) return ex;
        return { ...ex, sets: ex.sets.slice(0, -1) };
      }),
    );
  }

  function markExerciseDone(exerciseIdx: number) {
    setExerciseStates(prev => prev.map((ex, i) => (i === exerciseIdx ? { ...ex, done: true } : ex)));
    // Start rest timer
    const restSecs = exercises[exerciseIdx].restSeconds;
    if (restSecs > 0) setRestSeconds(restSecs);
    // Advance to next exercise
    if (exerciseIdx < exercises.length - 1) {
      setCurrentIdx(exerciseIdx + 1);
    }
  }

  function setFeedback(exerciseIdx: number, feedback: ExerciseFeedbackType | null) {
    setExerciseStates(prev => prev.map((ex, i) => (i === exerciseIdx ? { ...ex, feedback } : ex)));
  }

  async function finishSession(status: 'COMPLETED' | 'ABANDONED') {
    setFinishing(true);
    try {
      const completedExercises = exerciseStates.filter(ex => ex.sets.length > 0);
      await completeWorkoutSession(sessionId ?? 'offline', {
        status,
        exerciseLogs: completedExercises.map(ex => ({
          planExerciseId: ex.planExerciseId,
          completedAt: ex.done ? new Date().toISOString() : null,
          feedback: ex.feedback,
          feedbackNote: ex.feedbackNote,
          sets: ex.sets,
        })),
      });
    } catch {
      // best-effort
    } finally {
      setFinishing(false);
      onDone();
    }
  }

  const allDone = exerciseStates.every(ex => ex.done);

  if (!started) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent w-8 h-8" />
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Workout completed</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">You already trained this</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {lockMessage ?? 'This workout session has already been completed and cannot be submitted again.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-2xl py-3 text-sm font-semibold text-white"
            style={{ background: 'var(--color-accent)' }}
          >
            Back to training
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowConfirmFinish(true)}
          className="p-2 rounded-xl hover:bg-card text-muted-foreground"
        >
          <ArrowLeft aria-hidden="true" focusable="false" size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{assignment.workoutPlan.name}</h1>
          <p className="text-sm text-muted-foreground">
            {currentIdx + 1} / {exercises.length}
          </p>
        </div>
      </div>

      {/* Rest timer banner */}
      {restSeconds !== null && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
        >
          <Timer aria-hidden="true" focusable="false" size={18} />
          <span className="font-semibold">Rest: {restSeconds}s</span>
          <button className="ml-auto text-xs underline opacity-70" onClick={() => setRestSeconds(null)}>
            Skip
          </button>
        </div>
      )}

      {/* Exercise nav pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {exercises.map((ex, i) => {
          const done = exerciseStates[i].done;
          const active = i === currentIdx;
          return (
            <button
              key={ex.id}
              onClick={() => setCurrentIdx(i)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors"
              style={{
                background: active ? 'var(--color-accent-muted)' : 'var(--color-surface)',
                color: active
                  ? 'var(--color-accent)'
                  : done
                    ? 'var(--color-text-secondary)'
                    : 'var(--color-text-primary)',
                borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
              }}
            >
              {done && <CheckCircle2 aria-hidden="true" focusable="false" size={12} style={{ color: 'var(--color-accent)' }} />}
              {ex.video.title.length > 16 ? ex.video.title.slice(0, 15) + '…' : ex.video.title}
            </button>
          );
        })}
      </div>

      {/* Current exercise card */}
      {currentExercise && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden space-y-0">
          {/* Exercise header */}
          <div className="p-4 border-b border-border">
            <p className="text-xs text-muted-foreground mb-1">Exercise {currentIdx + 1}</p>
            <h2 className="text-base font-bold text-foreground">{currentExercise.video.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Target: {currentExercise.targetSets} sets · {currentExercise.minReps}–{currentExercise.maxReps} reps ·{' '}
              {currentExercise.restSeconds}s rest
            </p>
            {currentExercise.notes && (
              <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                <MessageSquare aria-hidden="true" focusable="false" size={12} className="mt-0.5 shrink-0" />
                {currentExercise.notes}
              </p>
            )}
          </div>

          {/* Sets */}
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-[2rem_1fr_1fr_1.5rem] gap-2 text-xs text-muted-foreground font-medium px-1">
              <span>#</span>
              <span>Reps</span>
              <span>Weight (kg)</span>
              <span></span>
            </div>

            {currentState.sets.map((set, si) => (
              <div key={si} className="grid grid-cols-[2rem_1fr_1fr_1.5rem] gap-2 items-center">
                <span className="text-sm text-muted-foreground font-mono text-center">{si + 1}</span>
                {/* Reps stepper */}
                <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-2 py-1.5">
                  <button
                    onClick={() => updateSet(currentIdx, si, { reps: Math.max(0, set.reps - 1) })}
                    className="text-muted-foreground"
                  >
                    <Minus aria-hidden="true" focusable="false" size={14} />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={set.reps}
                    onChange={e => updateSet(currentIdx, si, { reps: Number(e.target.value) })}
                    className="w-full text-center text-sm bg-transparent text-foreground outline-none"
                  />
                  <button
                    onClick={() => updateSet(currentIdx, si, { reps: set.reps + 1 })}
                    className="text-muted-foreground"
                  >
                    <Plus aria-hidden="true" focusable="false" size={14} />
                  </button>
                </div>
                {/* Weight stepper */}
                <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-2 py-1.5">
                  <button
                    onClick={() => updateSet(currentIdx, si, { weightKg: Math.max(0, set.weightKg - 2.5) })}
                    className="text-muted-foreground"
                  >
                    <Minus aria-hidden="true" focusable="false" size={14} />
                  </button>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={set.weightKg}
                    onChange={e => updateSet(currentIdx, si, { weightKg: Number(e.target.value) })}
                    className="w-full text-center text-sm bg-transparent text-foreground outline-none"
                  />
                  <button
                    onClick={() => updateSet(currentIdx, si, { weightKg: set.weightKg + 2.5 })}
                    className="text-muted-foreground"
                  >
                    <Plus aria-hidden="true" focusable="false" size={14} />
                  </button>
                </div>
                {/* Completed toggle */}
                <button
                  onClick={() => updateSet(currentIdx, si, { completed: !set.completed })}
                  className="flex items-center justify-center"
                >
                  <CheckCircle2 aria-hidden="true" focusable="false"
                    size={18}
                    style={{ color: set.completed ? 'var(--color-accent)' : 'var(--color-border)' }}
                  />
                </button>
              </div>
            ))}

            {/* Add/remove set */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => addSet(currentIdx)}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <Plus aria-hidden="true" focusable="false" size={13} /> Add set
              </button>
              {currentState.sets.length > 1 && (
                <button
                  onClick={() => removeSet(currentIdx)}
                  className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Minus aria-hidden="true" focusable="false" size={13} /> Remove last
                </button>
              )}
            </div>
          </div>

          {/* Feedback */}
          {currentState.done && (
            <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">How did it feel?</p>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFeedback(currentIdx, currentState.feedback === opt.value ? null : opt.value)}
                    className="text-xs px-3 py-1 rounded-full border transition-colors"
                    style={{
                      background: currentState.feedback === opt.value ? 'var(--color-accent-muted)' : 'transparent',
                      borderColor: currentState.feedback === opt.value ? 'var(--color-accent)' : 'var(--color-border)',
                      color:
                        currentState.feedback === opt.value ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Done button */}
          {!currentState.done && (
            <div className="px-4 pb-4">
              <button
                onClick={() => markExerciseDone(currentIdx)}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-white"
                style={{ background: 'var(--color-accent)' }}
              >
                Done with this exercise
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(i => i - 1)}
          className="flex-1 py-3 rounded-2xl text-sm font-medium border border-border flex items-center justify-center gap-2 text-foreground disabled:opacity-40"
        >
          <ChevronLeft aria-hidden="true" focusable="false" size={16} /> Previous
        </button>
        {currentIdx < exercises.length - 1 ? (
          <button
            onClick={() => setCurrentIdx(i => i + 1)}
            className="flex-1 py-3 rounded-2xl text-sm font-medium border border-border flex items-center justify-center gap-2 text-foreground"
          >
            Next <ChevronRight aria-hidden="true" focusable="false" size={16} />
          </button>
        ) : (
          <button
            onClick={() => finishSession('COMPLETED')}
            disabled={finishing}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'var(--color-accent)' }}
          >
            {finishing ? 'Saving…' : allDone ? 'Finish workout' : 'Finish early'}
          </button>
        )}
      </div>

      {/* Confirm finish modal */}
      {showConfirmFinish && (
        <div className="absolute inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/60">
          {' '}
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)' }}
          >
            <h3 className="text-base font-bold text-foreground">Leave workout?</h3>
            <p className="text-sm text-muted-foreground">Your progress will be saved up to here.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmFinish(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground"
              >
                Continue
              </button>
              <button
                disabled={finishing}
                onClick={() => finishSession('ABANDONED')}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--color-accent)' }}
              >
                {finishing ? 'Saving…' : 'Exit & save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
