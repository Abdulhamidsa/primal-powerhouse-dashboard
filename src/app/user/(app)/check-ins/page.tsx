'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { CalendarCheck2, ChevronDown, ClipboardCheck, Scale } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DailyCheckInCard } from '@/features/daily-checkin/components/DailyCheckInCard';
import { useClientSelfFeatureVisibility } from '@/features/client-feature-visibility/hooks/useClientSelfFeatureVisibility';

const WeeklyCheckInCard = dynamic(
  () => import('@/features/weekly-checkin/components/WeeklyCheckInCard.lazy.tsx').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <div className="h-56 animate-pulse rounded-3xl border border-border/70 bg-card/60" />,
  },
);

const DailyCheckInInsightsCard = dynamic(
  () => import('@/features/daily-checkin/components/DailyCheckInInsightsCard.lazy.tsx').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-3xl border border-border/70 bg-card/60" />,
  },
);

export default function UserCheckInsPage() {
  const { visibility } = useClientSelfFeatureVisibility();
  const [showWeightProgress, setShowWeightProgress] = useState(false);
  const dailyEnabled = visibility?.dailyCheckinsEnabled;
  const weeklyEnabled = visibility?.weeklyCheckinsEnabled;

  if (visibility && !dailyEnabled && !weeklyEnabled) {
    return (
      <div className="px-4 pb-8 pt-4 md:px-5">
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
    <div className="px-4 pb-8 pt-4 md:px-5">
      <div className="mx-auto w-full max-w-3xl space-y-4 md:space-y-5">
        <PageHeader title="Check-Ins" description="Share how you are doing so your coach can guide your next step." />

        {dailyEnabled ? (
          <section
            className="space-y-4 rounded-[30px] border p-4 shadow-sm backdrop-blur-xl sm:p-5"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <SectionHeading icon={<ClipboardCheck size={16} />} eyebrow="Daily" title="Daily Check-In" description="A quick update about how you feel and how your day is going." />
            <DailyCheckInCard />
          </section>
        ) : null}

        {weeklyEnabled ? (
          <section
            className="space-y-4 rounded-[30px] border p-4 shadow-sm backdrop-blur-xl sm:p-5"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <SectionHeading icon={<CalendarCheck2 size={16} />} eyebrow="Weekly" title="Weekly Check-In" description="Share a fuller reflection so your coach can review your week." />
            <WeeklyCheckInCard />
          </section>
        ) : null}

        {dailyEnabled && visibility?.dailyWeightEnabled ? (
          <section className="overflow-hidden rounded-[30px] border shadow-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
            <button
              type="button"
              onClick={() => setShowWeightProgress(previous => !previous)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--color-bg-alt)] sm:px-5"
              aria-expanded={showWeightProgress}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
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
  );
}

function SectionHeading({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border/70 pb-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
