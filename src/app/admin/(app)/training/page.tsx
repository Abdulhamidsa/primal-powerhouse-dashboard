'use client';

import { useState } from 'react';
import { ExerciseLibrary } from '@/features/training/components/ExerciseLibrary';
import { TemplateBuilder } from '@/features/training/components/TemplateBuilder';
import { PlanManager } from '@/features/training/components/PlanManager';

const TABS = [
  { key: 'exercises', label: 'Exercises' },
  { key: 'templates', label: 'Templates' },
  { key: 'plans', label: 'Training Plans' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function AdminTrainingPage() {
  const [tab, setTab] = useState<TabKey>('exercises');

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <h1 className="text-xl font-bold text-foreground">Training Management</h1>

        {/* Tab bar */}
        <div className="inline-flex rounded-2xl border border-border bg-card/60 p-1">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={[
                  'px-4 py-1.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap',
                  active
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div>
          {tab === 'exercises' && <ExerciseLibrary />}
          {tab === 'templates' && <TemplateBuilder />}
          {tab === 'plans' && <PlanManager />}
        </div>
      </div>
    </div>
  );
}
