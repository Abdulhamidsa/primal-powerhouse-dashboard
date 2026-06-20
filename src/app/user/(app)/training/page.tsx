'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Dumbbell, Play, Sparkles } from 'lucide-react';
// import { TrainingDashboard } from '@/features/training/components/TrainingDashboard';
import { UserTrainingAssignments } from '@/features/training/components/UserTrainingAssignments';
import WorkoutPlansSection from '@/features/workout-session/components/WorkoutPlansSection';
import { useUserWorkoutAssignments } from '@/features/workout-session/hooks/useUserWorkoutAssignments';
import { useUserTraining } from '@/features/training/hooks/useUserTraining';

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
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <section
          className="rounded-[30px] border px-4 py-4 shadow-[0_16px_50px_rgba(0,0,0,0.08)]"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Training</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Keep the next session easy to start</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Workout plans are your guided sessions. Exercise videos are the reference library you can open when you
                need a form reminder or a quick refresh.
              </p>
            </div>

            <div className="grid gap-2 sm:min-w-[220px]">
              <MiniStat label="Workout plans" value={`${assignments.length}`} />
              <MiniStat label="Exercise videos" value={`${videos.length}`} />
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

        {/* Tab bar */}
        <div className="inline-flex rounded-2xl border border-border bg-card/60 p-1">
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
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
