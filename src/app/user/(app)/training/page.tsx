'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ChevronDown, Dumbbell, Play } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { PullToRefresh } from '@/components/PullToRefresh';
import { TrainingDashboard } from '@/features/training/components/TrainingDashboard';
import { useTrainingPlan } from '@/features/training/hooks/useTrainingPlan';
import WorkoutPlansSection from '@/features/workout-session/components/WorkoutPlansSection';
import { useUserWorkoutAssignments } from '@/features/workout-session/hooks/useUserWorkoutAssignments';

const UserTrainingAssignments = dynamic(
  () => import('@/features/training/components/UserTrainingAssignments.lazy.tsx').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <div className="h-52 animate-pulse rounded-3xl border border-border/70 bg-card/60" />,
  },
);

export default function UserTrainingPage() {
  const [showVideos, setShowVideos] = useState(false);
  const { plan, isLoading: trainingPlanLoading, refresh: refreshTrainingPlan } = useTrainingPlan();
  const { assignments, mutate: refreshAssignments } = useUserWorkoutAssignments();
  const nextWorkout = assignments[0] ?? null;
  const refreshTraining = async () => {
    await Promise.all([refreshTrainingPlan(), refreshAssignments()]);
  };

  return (
    <PullToRefresh onRefresh={refreshTraining}>
      <div className="px-4 pb-8 pt-4 md:px-6">
        <div className="mx-auto w-full max-w-4xl space-y-4 md:space-y-5">
        <PageHeader title="Training" description="Choose a workout plan, then start or continue your next session." />

        {trainingPlanLoading ? <div className="h-56 animate-pulse rounded-[30px] border border-border bg-card/70" /> : null}
        {plan ? <TrainingDashboard /> : !trainingPlanLoading ? <section className="rounded-[30px] border p-4 shadow-sm backdrop-blur-xl sm:p-5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]"><Dumbbell size={18} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Next workout</p>
              <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">
                {nextWorkout ? nextWorkout.workoutPlan.name : 'No workout assigned yet'}
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {nextWorkout
                  ? `${nextWorkout.workoutPlan.exercises.length} exercise${nextWorkout.workoutPlan.exercises.length === 1 ? '' : 's'} ready when you are.`
                  : 'Your coach will add your next workout plan here.'}
              </p>
            </div>
          </div>

          {nextWorkout ? <Link href={`/user/workout/${encodeURIComponent(nextWorkout.id)}`} className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><span>Start workout</span><ArrowRight size={16} /></Link> : null}

        </section> : null}

        {!plan && !trainingPlanLoading ? <section className="rounded-[30px] border p-4 shadow-sm" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-alt)] text-muted-foreground">
                <Dumbbell size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your plans</p>
                <h2 className="mt-1 text-base font-semibold text-foreground">Workout plans</h2>
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{assignments.length} assigned</span>
          </div>

          <div className="mt-3">
            <WorkoutPlansSection />
          </div>
        </section> : null}

        <section className="overflow-hidden rounded-[26px] border shadow-sm" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <button type="button" onClick={() => setShowVideos(previous => !previous)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--color-bg-alt)]" aria-expanded={showVideos}>
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-alt)] text-muted-foreground"><Play size={15} /></span>
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Optional reference</span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">Exercise videos</span>
              </span>
            </span>
            <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${showVideos ? 'rotate-180' : ''}`} />
          </button>

          {showVideos ? <div className="border-t border-border/70 p-4"><UserTrainingAssignments /></div> : null}
        </section>
        </div>
      </div>
    </PullToRefresh>
  );
}
