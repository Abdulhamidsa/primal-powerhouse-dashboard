'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Dumbbell, Play, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
// import { TrainingDashboard } from '@/features/training/components/TrainingDashboard';
import WorkoutPlansSection from '@/features/workout-session/components/WorkoutPlansSection';
import { useUserWorkoutAssignments } from '@/features/workout-session/hooks/useUserWorkoutAssignments';
import { useUserTraining } from '@/features/training/hooks/useUserTraining';

const UserTrainingAssignments = dynamic(
  () => import('@/features/training/components/UserTrainingAssignments.lazy.tsx').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <div className="h-52 animate-pulse rounded-3xl border border-border/70 bg-card/60" />,
  },
);

const TABS = [
  { key: 'plans', label: 'Workout Plans' },
  { key: 'videos', label: 'Exercise Videos' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function UserTrainingPage() {
  const [tab, setTab] = useState<TabKey>('plans');
  const { assignments } = useUserWorkoutAssignments();
  const { filteredAssignments: videos } = useUserTraining();
  const nextWorkout = assignments[0] ?? null;

  return (
    <div className="px-4 pb-8 pt-4 md:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <PageHeader
          label="Training"
          title="Keep the next session easy to start"
          description="Workout plans are your guided sessions. Exercise videos are the reference library you can open when you need a form reminder or a quick refresh."
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-bg-alt)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
              {assignments.length} workout plan{assignments.length === 1 ? '' : 's'}
            </span>
            <span className="rounded-full bg-[var(--color-bg-alt)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
              {videos.length} exercise video{videos.length === 1 ? '' : 's'}
            </span>
            <span className="rounded-full bg-[var(--color-accent-translucent)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
              Start, continue, finish
            </span>
          </div>
        </PageHeader>

        <section
          className="rounded-[30px] border bg-card/75 px-4 py-4 shadow-sm backdrop-blur-xl"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Resume</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                {nextWorkout ? 'Continue where you left off' : 'No active workout right now'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {nextWorkout
                  ? `${nextWorkout.workoutPlan.name} is ready for your next session.`
                  : 'Use workout plans for guided sessions and exercise videos for form reminders.'}
              </p>
            </div>

            <div className="grid gap-2 sm:min-w-[220px]">
              <MiniStat
                label="Workout plans"
                value={nextWorkout ? `${assignments.length} active` : `${assignments.length}`}
              />
              <MiniStat label="Exercise videos" value={`${videos.length} available`} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
              <Dumbbell size={12} />
              Guided workouts
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
              <Play size={12} />
              Exercise videos
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
              <Sparkles size={12} />
              Start, continue, finish
            </span>
          </div>

          {nextWorkout ? (
            <Link
              href={`/user/workout/${encodeURIComponent(nextWorkout.id)}`}
              className="mt-4 flex items-center justify-between gap-3 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Continue</p>
                <p className="mt-1 truncate text-sm font-semibold text-[var(--color-text)]">{nextWorkout.workoutPlan.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {nextWorkout.workoutPlan.exercises.length} exercise
                  {nextWorkout.workoutPlan.exercises.length === 1 ? '' : 's'} ready for your next session
                </p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-[var(--color-text-muted)]" />
            </Link>
          ) : null}
        </section>

        {/* <TrainingDashboard /> */}

        <div className="inline-flex rounded-[20px] border border-border/70 bg-card/70 p-1 shadow-sm backdrop-blur-xl">
          {TABS.map(t => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={[
                  'px-4 py-1.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap',
                  active ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'plans' && <WorkoutPlansSection />}
        {tab === 'videos' && <UserTrainingAssignments />}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
