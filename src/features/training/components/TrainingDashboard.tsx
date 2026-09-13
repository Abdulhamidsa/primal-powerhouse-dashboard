'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight, Dumbbell, Flag, RefreshCcw, Sparkles } from 'lucide-react';
import { WorkoutSessionPlayer } from '@/features/training/components/WorkoutSessionPlayer';
import { useTrainingPlan } from '@/features/training/hooks/useTrainingPlan';
import { useTrainingSession, useTrainingSessionActions } from '@/features/training/hooks/useTrainingSession';
import type { TrainingPlanDayDTO } from '@/features/training/types/clientTraining.types';

function getTodayDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function formatDate(value: string) {
  return new Date(`${dateKey(value)}T12:00:00`).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function weekdayLabel(day: TrainingPlanDayDTO) {
  if (typeof day.weekday === 'number') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day.weekday] ?? 'Day';
  }

  return new Date(`${dateKey(day.date)}T12:00:00`).toLocaleDateString([], {
    weekday: 'short',
  });
}

function dayTitle(day: TrainingPlanDayDTO) {
  return day.title ?? day.workoutTemplate?.name ?? (day.type === 'REST' ? 'Rest day' : 'Workout');
}

function relativeDayLabel(day: TrainingPlanDayDTO, today: string) {
  const current = new Date(`${today}T12:00:00`);
  const target = new Date(`${dateKey(day.date)}T12:00:00`);
  const diffDays = Math.round((target.getTime() - current.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return weekdayLabel(day);
}

function isCompleted(day: TrainingPlanDayDTO) {
  return day.status === 'COMPLETED' || day.latestSession?.status === 'COMPLETED';
}

function isStartable(day: TrainingPlanDayDTO) {
  return day.type === 'WORKOUT' && !isCompleted(day) && day.status !== 'SKIPPED' && Boolean(day.workoutTemplate);
}

function DayStatus({ day, today }: { day: TrainingPlanDayDTO; today: string }) {
  if (isCompleted(day)) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><Check size={13} /> Done</span>;
  if (day.status === 'SKIPPED') return <span className="text-xs font-semibold text-muted-foreground">Skipped</span>;
  if (day.type === 'REST') return <span className="text-xs font-semibold text-emerald-600">Rest</span>;
  if (day.latestSession?.status === 'IN_PROGRESS') return <span className="text-xs font-semibold text-primary">In progress</span>;
  if (dateKey(day.date) === today) return <span className="text-xs font-semibold text-primary">Today</span>;
  return <span className="text-xs font-semibold text-muted-foreground">Upcoming</span>;
}

export function TrainingDashboard() {
  const today = useMemo(getTodayDateKey, []);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { plan, isLoading, error, refresh } = useTrainingPlan();
  const { session } = useTrainingSession(activeSessionId ?? undefined);
  const { startSession } = useTrainingSessionActions();

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!activeSessionId) return;

    const originalOverflow = document.body.style.overflow;
    const originalOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscrollBehavior;
    };
  }, [activeSessionId]);

  const days = useMemo(
    () =>
      [...(plan?.days ?? [])].sort((a, b) => {
        const aWeekday = typeof a.weekday === 'number' ? a.weekday : 99;
        const bWeekday = typeof b.weekday === 'number' ? b.weekday : 99;
        return aWeekday === bWeekday ? dateKey(a.date).localeCompare(dateKey(b.date)) : aWeekday - bWeekday;
      }),
    [plan?.days],
  );
  const todayDay = days.find(day => dateKey(day.date) === today) ?? null;
  const nextWorkout = days.find(day => isStartable(day) && dateKey(day.date) >= today) ?? null;

  if (activeSessionId && session && portalTarget) {
    return createPortal(
      <div
        className="fixed inset-0 isolate overflow-y-auto bg-background"
        style={{
          zIndex: 2147483647,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <WorkoutSessionPlayer
          session={session}
          onClose={() => setActiveSessionId(null)}
          onCompleted={() => {
            setActiveSessionId(null);
            refresh();
          }}
        />
      </div>,
      portalTarget,
    );
  }

  if (isLoading) return <div className="h-56 animate-pulse rounded-[28px] border border-border bg-card/70" />;
  if (error) return <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">Failed to load your training plan.</div>;
  if (!plan) return null;

  const canStartToday = todayDay ? isStartable(todayDay) : false;
  const startableTodayDay = canStartToday ? todayDay : null;
  const todayDone = todayDay ? isCompleted(todayDay) : false;
  const nextWorkoutLabel = nextWorkout ? `${relativeDayLabel(nextWorkout, today)} - ${dayTitle(nextWorkout)}` : null;

  const handleStart = async (day: TrainingPlanDayDTO) => {
    setActionError(null);
    try {
      const started = await startSession({ planDayId: day.id });
      setActiveSessionId(started.id);
    } catch (startError) {
      setActionError(startError instanceof Error ? startError.message : 'Unable to start this workout.');
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-[30px] border p-5 shadow-sm" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]"><Dumbbell size={18} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Today’s training</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{todayDay ? dayTitle(todayDay) : 'No workout scheduled'}</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {todayDone
                  ? 'Workout completed. Nice work.'
                  : todayDay?.note ?? (todayDay?.type === 'REST'
                    ? nextWorkoutLabel ? `Recovery day. Next up: ${nextWorkoutLabel}.` : 'Take the day to recover.'
                    : nextWorkoutLabel ? `Next up: ${nextWorkoutLabel}.` : 'Your coach has not added a workout for this week yet.')}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => refresh()} aria-label="Refresh training plan" className="rounded-full p-2 text-muted-foreground hover:bg-muted/60"><RefreshCcw size={15} /></button>
        </div>

        {actionError ? <p className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p> : null}
        <div className="mt-4 rounded-2xl border border-border/70 bg-muted/20 p-3">
          {todayDone ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600"><Check size={17} /> Done for today</div>
          ) : todayDay?.type === 'REST' ? (
            <div className="flex flex-col gap-1 text-sm">
              <span className="flex items-center gap-2 font-semibold text-emerald-600"><Flag size={17} /> Rest and recover</span>
              {nextWorkout ? <span className="text-muted-foreground">Next workout: {nextWorkoutLabel}</span> : null}
            </div>
          ) : startableTodayDay ? (
            <button type="button" onClick={() => handleStart(startableTodayDay)} className="flex min-h-11 w-full items-center justify-between rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              <span>{startableTodayDay.latestSession?.status === 'IN_PROGRESS' ? 'Continue workout' : 'Start workout'}</span><ChevronRight size={16} />
            </button>
          ) : <p className="text-sm text-muted-foreground">{nextWorkoutLabel ? `No workout today. Next up: ${nextWorkoutLabel}.` : 'No workout is available this week.'}</p>}
        </div>
      </section>

      <section className="rounded-[30px] border p-5 shadow-sm" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">This week</p><h2 className="mt-1 text-base font-semibold text-foreground">{plan.name}</h2></div>
          {nextWorkoutLabel ? <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:inline-flex">Next workout</span> : null}
        </div>
        {nextWorkoutLabel ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
            <Sparkles size={15} />
            <span className="font-semibold">Next workout:</span>
            <span className="min-w-0 truncate">{nextWorkoutLabel}</span>
          </div>
        ) : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {days.map(day => {
            const isToday = dateKey(day.date) === today;
            const isNext = day.id === nextWorkout?.id;
            const canStart = isToday && isStartable(day);
            return <div key={day.id} className={`min-h-[142px] rounded-2xl border p-3 transition-colors ${isToday ? 'border-primary bg-primary/5 shadow-sm' : isNext ? 'border-primary/40 bg-primary/5' : 'border-border/70 bg-background/40'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>{isToday ? 'Today' : weekdayLabel(day)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(day.date)}</p>
                </div>
                <DayStatus day={day} today={today} />
              </div>
              <div className="mt-4 min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{dayTitle(day)}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {day.note ?? (day.type === 'REST' ? 'Recovery day' : day.workoutTemplate ? `${day.workoutTemplate.exercises.length} exercises` : 'Workout')}
                </p>
              </div>
              {canStart ? <button type="button" onClick={() => handleStart(day)} className="mt-3 flex min-h-9 w-full items-center justify-between rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                <span>{day.latestSession?.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}</span><ChevronRight size={14} />
              </button> : isNext && !isToday ? <p className="mt-3 text-xs font-semibold text-primary">Next workout</p> : null}
            </div>;
          })}
          {days.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Your coach has not added any scheduled days yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
