'use client';

import { useState, useEffect, useRef } from 'react';
import type { WorkoutPlanAssignmentWithPlan } from '@/features/workout-plans/types/workoutPlan.types';
import type { LocalExerciseState, LocalSetEntry, ExerciseFeedbackType } from '../types/workoutSession.types';
import { buildInitialExerciseState } from '../lib/progression';
import { startWorkoutSession, completeWorkoutSession } from '../api/workoutSession.api';
import MobileExerciseHero from './mobile/MobileExerciseHero';
import MobileExerciseDetails from './mobile/MobileExerciseDetails';
import MobileExerciseSetsForm from './mobile/MobileExerciseSetsForm';
import MobileExerciseFeedback from './mobile/MobileExerciseFeedback';
import MobileWorkoutHeader from './mobile/MobileWorkoutHeader';
import MobileWorkoutActions from './mobile/MobileWorkoutActions';
import MobileRestTimerOverlay from './mobile/MobileRestTimerOverlay';
import MobileExitConfirmation from './mobile/MobileExitConfirmation';

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

export default function MobileWorkoutSessionPlayer({ assignment, onDone }: Props) {
  const exercises = assignment.workoutPlan.exercises;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [exerciseStates, setExerciseStates] = useState<LocalExerciseState[]>(() =>
    buildInitialExerciseState(exercises),
  );
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<number | null>(null);

  const currentExercise = exercises[currentIdx];
  const currentState = exerciseStates[currentIdx];
  const totalExercises = exercises.length;
  const completedCount = exerciseStates.filter(ex => ex.done).length;

  // Start session on mount
  useEffect(() => {
    startWorkoutSession(assignment.id)
      .then(s => {
        setSessionId(s.id);
        setStarted(true);
      })
      .catch(() => {
        setStarted(true); /* offline fallback */
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
      handleNavigateToExercise(exerciseIdx + 1);
    }
  }

  function setFeedback(exerciseIdx: number, feedback: ExerciseFeedbackType | null) {
    setExerciseStates(prev => prev.map((ex, i) => (i === exerciseIdx ? { ...ex, feedback } : ex)));
  }

  function setFeedbackNote(exerciseIdx: number, note: string) {
    setExerciseStates(prev => prev.map((ex, i) => (i === exerciseIdx ? { ...ex, feedbackNote: note } : ex)));
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

  async function handleNavigateToExercise(newIdx: number) {
    if (newIdx === currentIdx || isTransitioning) return;
    setIsTransitioning(true);
    await new Promise(r => setTimeout(r, 300));
    setCurrentIdx(newIdx);
    setIsTransitioning(false);
  }

  async function handleNext() {
    if (currentIdx < exercises.length - 1) {
      await handleNavigateToExercise(currentIdx + 1);
    }
  }

  async function handlePrev() {
    if (currentIdx > 0) {
      await handleNavigateToExercise(currentIdx - 1);
    }
  }

  // Swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;

    if (Math.abs(diff) > 50) {
      // Swipe threshold 50px
      if (diff > 0) {
        // Swiped left (next)
        handleNext();
      } else {
        // Swiped right (prev)
        handlePrev();
      }
    }
    touchStartRef.current = null;
  };

  const allDone = exerciseStates.every(ex => ex.done);
  const isLastExercise = currentIdx === exercises.length - 1;

  if (!started) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full border-2 border-accent border-t-transparent w-12 h-12" />
          <p className="text-sm text-muted-foreground">Loading workout...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full min-h-0 bg-background overflow-hidden flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <MobileWorkoutHeader
        workoutName={assignment.workoutPlan.name}
        currentIdx={currentIdx}
        totalExercises={totalExercises}
        completedCount={completedCount}
        onExit={() => setShowExitConfirm(true)}
      />

      {/* Main scrollable area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Hero Section */}
        <MobileExerciseHero exercise={currentExercise} isTransitioning={isTransitioning} />

        {/* Exercise Details */}
        <MobileExerciseDetails exercise={currentExercise} isTransitioning={isTransitioning} />

        {/* Sets Form */}
        <MobileExerciseSetsForm
          state={currentState}
          exercise={currentExercise}
          currentIdx={currentIdx}
          onUpdateSet={updateSet}
          onAddSet={addSet}
          onRemoveSet={removeSet}
          onMarkDone={markExerciseDone}
          isTransitioning={isTransitioning}
        />

        {/* Feedback Section */}
        {currentState.done && (
          <MobileExerciseFeedback
            feedback={currentState.feedback}
            feedbackNote={currentState.feedbackNote}
            currentIdx={currentIdx}
            onFeedbackChange={setFeedback}
            onFeedbackNoteChange={setFeedbackNote}
            feedbackOptions={FEEDBACK_OPTIONS}
            isTransitioning={isTransitioning}
          />
        )}

        {/* Bottom Actions with safe area */}
        <MobileWorkoutActions
          onDone={() => markExerciseDone(currentIdx)}
          onPrev={handlePrev}
          onNext={handleNext}
          isDone={currentState.done}
          isLastExercise={isLastExercise}
          isFinishing={finishing}
          allDone={allDone}
          canFinish={isLastExercise}
          onFinish={() => finishSession('COMPLETED')}
        />
      </div>

      {/* Rest Timer Overlay */}
      {restSeconds !== null && <MobileRestTimerOverlay seconds={restSeconds} onSkip={() => setRestSeconds(null)} />}

      {/* Exit Confirmation */}
      {showExitConfirm && (
        <MobileExitConfirmation
          onContinue={() => setShowExitConfirm(false)}
          onExit={() => finishSession('ABANDONED')}
          isLoading={finishing}
        />
      )}
    </div>
  );
}
