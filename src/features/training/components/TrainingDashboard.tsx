'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Dumbbell, RefreshCcw } from 'lucide-react';
import { WorkoutSessionPlayer } from '@/features/training/components/WorkoutSessionPlayer';
import { useTrainingPlan, useTrainingPlanDay } from '@/features/training/hooks/useTrainingPlan';
import { useTrainingSessionActions, useTrainingSession } from '@/features/training/hooks/useTrainingSession';

function getTodayDateKeyLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TrainingDashboard() {
  const todayDateKey = useMemo(() => getTodayDateKeyLocal(), []);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const { plan, isLoading: planLoading, error: planError, refresh: refreshPlan } = useTrainingPlan();
  const { planDay, isLoading: dayLoading, error: dayError, refresh: refreshToday } = useTrainingPlanDay(todayDateKey);
  const { session } = useTrainingSession(activeSessionId ?? undefined);
  const { startSession } = useTrainingSessionActions();

  const todayWorkout = planDay?.type === 'WORKOUT' ? planDay : null;
  const activeTemplateName = todayWorkout?.workoutTemplate?.name ?? todayWorkout?.title ?? "Today's workout";

  if (activeSessionId && session) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setActiveSessionId(null)}
          className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60"
        >
          Back to plan
        </button>
        {/* <WorkoutSessionPlayer session={session} /> */}
      </div>
    );
  }

  if (planError || dayError) {
    return (
      <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
        Failed to load training plan.
      </div>
    );
  }

  if (planLoading || dayLoading) {
    return <div className="h-48 animate-pulse rounded-[28px] border border-border bg-card/80" />;
  }

  if (!plan) {
    return (
      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-primary/10 p-2 text-primary">
            <Dumbbell size={18} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Training plandsds</h3>
            <p className="text-sm text-muted-foreground">Your coach has not assigned a training plan yet.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <CalendarDays size={13} />
            Training dashboard
          </div>
          <h2 className="text-2xl font-semibold text-foreground">{plan.name}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {plan.description ?? "Follow your plan day by day. Start today's workout when you are ready."}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-3 py-1">Status {plan.status}</span>
            <span className="rounded-full border border-border bg-background px-3 py-1">{plan.days.length} days</span>
            <span className="rounded-full border border-border bg-background px-3 py-1">Today {todayDateKey}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            refreshPlan();
            refreshToday();
          }}
          className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60"
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      <div className="mt-5 rounded-[24px] border border-border bg-muted/30 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Today</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">{activeTemplateName}</h3>
            <p className="text-sm text-muted-foreground">
              {todayWorkout?.note ?? (todayWorkout ? 'Ready to train.' : 'No workout scheduled for today.')}
            </p>
          </div>

          {todayWorkout ? (
            <button
              type="button"
              onClick={async () => {
                const sessionResult = await startSession({ planDayId: todayWorkout.id });
                setActiveSessionId(sessionResult.id);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start workout
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {plan.days.slice(0, 3).map(day => (
          <div key={day.id} className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{day.date.slice(0, 10)}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {day.title ?? day.workoutTemplate?.name ?? day.type}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {day.status} · {day.type}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
