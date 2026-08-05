'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronRight, Dumbbell, Flag, RefreshCcw } from 'lucide-react';
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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function dayTitle(day: TrainingPlanDayDTO) {
  return day.title ?? day.workoutTemplate?.name ?? (day.type === 'REST' ? 'Rest day' : 'Workout');
}

function DayStatus({ day, today }: { day: TrainingPlanDayDTO; today: string }) {
  if (day.status === 'COMPLETED' || day.latestSession?.status === 'COMPLETED') return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><Check size={13} /> Done</span>;
  if (day.status === 'SKIPPED') return <span className="text-xs font-semibold text-muted-foreground">Skipped</span>;
  if (day.type === 'REST') return <span className="text-xs font-semibold text-emerald-600">Rest</span>;
  if (day.latestSession?.status === 'IN_PROGRESS') return <span className="text-xs font-semibold text-primary">In progress</span>;
  if (dateKey(day.date) === today) return <span className="text-xs font-semibold text-primary">Today</span>;
  return <span className="text-xs font-semibold text-muted-foreground">Upcoming</span>;
}

export function TrainingDashboard() {
  const today = useMemo(getTodayDateKey, []);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { plan, isLoading, error, refresh } = useTrainingPlan();
  const { session } = useTrainingSession(activeSessionId ?? undefined);
  const { startSession } = useTrainingSessionActions();

  const days = useMemo(() => [...(plan?.days ?? [])].sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date))), [plan?.days]);
  const todayDay = days.find(day => dateKey(day.date) === today) ?? null;
  const nextWorkout = days.find(day => day.type === 'WORKOUT' && day.status === 'PENDING' && dateKey(day.date) <= today && day.latestSession?.status !== 'COMPLETED') ?? null;
  const upcomingWorkout = days.find(day => day.type === 'WORKOUT' && day.status === 'PENDING' && dateKey(day.date) > today) ?? null;

  if (activeSessionId && session) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setActiveSessionId(null)} className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60">
          Back to plan
        </button>
        <WorkoutSessionPlayer session={session} onCompleted={() => { setActiveSessionId(null); refresh(); }} />
      </div>
    );
  }

  if (isLoading) return <div className="h-56 animate-pulse rounded-[28px] border border-border bg-card/70" />;
  if (error) return <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">Failed to load your training plan.</div>;
  if (!plan) return null;

  const canStartToday = todayDay?.type === 'WORKOUT' && todayDay.status !== 'COMPLETED' && todayDay.status !== 'SKIPPED' && todayDay.latestSession?.status !== 'COMPLETED' && Boolean(todayDay.workoutTemplate);
  const todayDone = todayDay?.status === 'COMPLETED' || todayDay?.latestSession?.status === 'COMPLETED';

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
                {todayDone ? 'Workout completed. Nice work.' : todayDay?.note ?? (todayDay?.type === 'REST' ? 'Take the day to recover.' : 'Your next workout will appear here.')}
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
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600"><Flag size={17} /> Rest and recover</div>
          ) : canStartToday ? (
            <button type="button" onClick={() => handleStart(todayDay)} className="flex min-h-11 w-full items-center justify-between rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              <span>{todayDay.latestSession?.status === 'IN_PROGRESS' ? 'Continue workout' : 'Start workout'}</span><ChevronRight size={16} />
            </button>
          ) : <p className="text-sm text-muted-foreground">No workout is available for today.</p>}
        </div>
      </section>

      <section className="rounded-[30px] border p-5 shadow-sm" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your schedule</p><h2 className="mt-1 text-base font-semibold text-foreground">{plan.name}</h2></div>
          {nextWorkout ? <span className="text-xs text-muted-foreground">Next: {formatDate(nextWorkout.date)}</span> : upcomingWorkout ? <span className="text-xs text-muted-foreground">Upcoming: {formatDate(upcomingWorkout.date)}</span> : null}
        </div>
        <div className="mt-4 space-y-2">
          {days.map(day => {
            const isNext = day.id === nextWorkout?.id;
            return <div key={day.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${isNext ? 'border-primary/40 bg-primary/5' : 'border-border/70 bg-background/40'}`}>
              <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{formatDate(day.date)}</p><p className="mt-0.5 truncate text-sm font-semibold text-foreground">{dayTitle(day)}</p></div>
              <DayStatus day={day} today={today} />
              {isNext ? <button type="button" onClick={() => handleStart(day)} className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Start</button> : null}
            </div>;
          })}
          {days.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Your coach has not added any scheduled days yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
