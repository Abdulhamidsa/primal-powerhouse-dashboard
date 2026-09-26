'use client';

import { useState } from 'react';
import { CalendarDotsIcon as CalendarDays, BarbellIcon as Dumbbell, BooksIcon as LibraryBig, PathIcon as Route, FlowArrowIcon as Workflow } from '@phosphor-icons/react';
import { AdminPage, AdminPageHeader, AdminPanel } from '@/features/admin-shell/components/AdminPage';
import { ExerciseLibrary } from '@/features/training/components/ExerciseLibrary';
import { TemplateBuilder } from '@/features/training/components/TemplateBuilder';
import { PlanManager } from '@/features/training/components/PlanManager';
import { PlanAssignmentManager } from '@/features/training/components/PlanAssignmentManager';

const TABS = [
  { key: 'exercises', label: 'Exercise Library', step: '01', icon: LibraryBig, description: 'Build the movement database' },
  { key: 'templates', label: 'Templates', step: '02', icon: Dumbbell, description: 'Combine exercises into workouts' },
  { key: 'plans', label: 'Client Plans', step: '03', icon: Route, description: 'Create availability windows' },
  { key: 'assignments', label: 'Weekly Pattern', step: '04', icon: CalendarDays, description: 'Program Monday to Sunday' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function AdminTrainingPage() {
  const [tab, setTab] = useState<TabKey>('assignments');

  return (
    <AdminPage className="max-w-none">
      <AdminPageHeader
        eyebrow="Training management"
        title="Training Workspace"
        description="Build the library, create reusable workout templates, open client plan windows, then program the weekly pattern that clients follow."
        actions={
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-muted-foreground">
            <Workflow aria-hidden="true" focusable="false" size={15} className="text-[var(--color-accent)]" />
            Library → Templates → Plans → Week
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={[
                'group rounded-[22px] border p-4 text-left transition-all',
                active
                  ? 'border-[var(--color-accent)]/45 bg-[var(--color-accent-translucent)] shadow-[0_20px_60px_rgba(0,0,0,0.22)]'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{t.step}</span>
                <span
                  className={[
                    'grid h-10 w-10 place-items-center rounded-2xl border',
                    active
                      ? 'border-[var(--color-accent)]/35 bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                      : 'border-white/10 bg-white/[0.04] text-muted-foreground group-hover:text-foreground',
                  ].join(' ')}
                >
                  <Icon size={18} />
                </span>
              </div>
              <h2 className="mt-3 text-base font-semibold text-foreground">{t.label}</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{t.description}</p>
            </button>
          );
        })}
      </section>

      <AdminPanel className="overflow-hidden">
        <div className="border-b border-white/10 px-5 py-3">
          <div className="flex flex-wrap gap-2">
          {TABS.map(t => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={[
                  'rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)]'
                    : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
                ].join(' ')}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        </div>

        <div className="p-5">
          {tab === 'exercises' && <ExerciseLibrary />}
          {tab === 'templates' && <TemplateBuilder />}
          {tab === 'plans' && <PlanManager />}
          {tab === 'assignments' && <PlanAssignmentManager />}
        </div>
      </AdminPanel>
    </AdminPage>
  );
}
