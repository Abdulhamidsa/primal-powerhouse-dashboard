'use client';

import { useState } from 'react';
import { TrainingDashboard } from '@/features/training/components/TrainingDashboard';
import { UserTrainingAssignments } from '@/features/training/components/UserTrainingAssignments';
import WorkoutPlansSection from '@/features/workout-session/components/WorkoutPlansSection';

const TABS = [
  { key: 'plans', label: 'Workout Plans' },
  { key: 'videos', label: 'Exercise Videos' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function UserTrainingPage() {
  const [tab, setTab] = useState<TabKey>('plans');

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <h1 className="text-xl font-bold text-foreground">Training</h1>

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
