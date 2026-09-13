'use client';

import dynamic from 'next/dynamic';
import { ChevronDown, Scale } from 'lucide-react';
import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { PageHeader } from '@/components/PageHeader';
import { PullToRefresh } from '@/components/PullToRefresh';
import { DailyCheckInCard } from '@/features/daily-checkin/components/DailyCheckInCard';
import { useClientSelfFeatureVisibility } from '@/features/client-feature-visibility/hooks/useClientSelfFeatureVisibility';

const WeeklyCheckInCard = dynamic(
  () => import('@/features/weekly-checkin/components/WeeklyCheckInCard.lazy.tsx').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <div className="h-24 animate-pulse rounded-[26px] bg-[var(--color-surface)]" />,
  },
);

const DailyCheckInInsightsCard = dynamic(
  () => import('@/features/daily-checkin/components/DailyCheckInInsightsCard.lazy.tsx').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-[26px] bg-[var(--color-surface)]" />,
  },
);

export default function UserCheckInsPage() {
  const { mutate } = useSWRConfig();
  const { visibility } = useClientSelfFeatureVisibility();
  const [showWeightProgress, setShowWeightProgress] = useState(false);
  const dailyEnabled = visibility?.dailyCheckinsEnabled;
  const weeklyEnabled = visibility?.weeklyCheckinsEnabled;
  const refreshCheckIns = async () => {
    await Promise.all([
      mutate('/api/client/feature-visibility'),
      mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/user/daily-checkins')),
      mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/user/weekly-checkins')),
    ]);
  };

  if (visibility && !dailyEnabled && !weeklyEnabled) {
    return (
      <div className="px-4 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-4 md:px-5">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <PageHeader title="Check-Ins" description="Share your progress with your coach." />
          <div
            className="rounded-[28px] border p-5 shadow-sm"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <p className="text-sm text-[var(--color-text-muted)]">
              Check-in features are not available at this time. Please contact your coach for more information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refreshCheckIns}>
      <div className="px-4 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] pt-4 md:px-5">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          <div className="px-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              Daily rhythm
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">Check-Ins</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
              Share how you are doing so your coach can guide your next step.
            </p>
          </div>

        {dailyEnabled ? (
          <section className="space-y-3">
            <div className="px-1">
              <p className="text-sm font-semibold text-[var(--color-text)]">Daily Check-In</p>
              <p className="text-xs text-[var(--color-text-muted)]">A quick update about how your day is going.</p>
            </div>
            <DailyCheckInCard />
          </section>
        ) : null}

        {weeklyEnabled ? (
          <section className="space-y-3">
            <div className="px-1">
              <p className="text-sm font-semibold text-[var(--color-text)]">Weekly Review</p>
              <p className="text-xs text-[var(--color-text-muted)]">A fuller reflection when your coach needs the weekly picture.</p>
            </div>
            <WeeklyCheckInCard />
          </section>
        ) : null}

        {dailyEnabled && visibility?.dailyWeightEnabled ? (
          <section className="overflow-hidden rounded-[26px] border shadow-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
            <button
              type="button"
              onClick={() => setShowWeightProgress(previous => !previous)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-alt)] sm:px-5"
              aria-expanded={showWeightProgress}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
                  <Scale size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Optional</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">Weight progress</span>
                </span>
              </span>
              <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${showWeightProgress ? 'rotate-180' : ''}`} />
            </button>

            {showWeightProgress ? (
              <div className="border-t border-border/70 p-3 sm:p-4">
                <DailyCheckInInsightsCard />
              </div>
            ) : null}
          </section>
        ) : null}
        </div>
      </div>
    </PullToRefresh>
  );
}
