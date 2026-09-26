'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  PulseIcon as Activity,
  ArrowRightIcon as ArrowRight,
  CaretDownIcon as ChevronDown,
  ScalesIcon as Scale,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSWRConfig } from 'swr';
import { PullToRefresh } from '@/components/PullToRefresh';
import { UserPageHero, type UserPageHeroStatusItem } from '@/components/UserPageHero';
import { DailyCheckInCard } from '@/features/daily-checkin/components/DailyCheckInCard';
import { useClientSelfFeatureVisibility } from '@/features/client-feature-visibility/hooks/useClientSelfFeatureVisibility';
import { calculateCompletionPercentage, getCompletionCount } from '@/features/daily-checkin/lib/dailyCheckInAnalytics';
import { useDailyCheckInToday } from '@/features/daily-checkin/hooks/useDailyCheckIn';
import { useDailyNutritionToday } from '@/features/daily-nutrition/hooks/useDailyNutrition';
import { useDailyTrainingToday } from '@/features/daily-training/hooks/useDailyTraining';
import { useWeeklyCheckInCurrentWeek } from '@/features/weekly-checkin/hooks/useWeeklyCheckIn';
import { useUserProfile } from '@/features/user-profile/hooks/useUserProfile';

const DailyCheckInInsightsCard = dynamic(
  () => import('@/features/daily-checkin/components/DailyCheckInInsightsCard.lazy.tsx').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-[26px] bg-[var(--color-surface)]" />,
  },
);

export default function UserCheckInsPage() {
  const router = useRouter();
  const { user, isLoading: profileLoading } = useUserProfile();
  useEffect(() => {
    if (!profileLoading && user?.accessMode === 'SELF_SERVICE') router.replace('/user/dashboard');
  }, [profileLoading, router, user?.accessMode]);
  const { mutate } = useSWRConfig();
  const { visibility } = useClientSelfFeatureVisibility();
  const { entry: dailyEntry } = useDailyCheckInToday();
  const { entry: nutritionEntry } = useDailyNutritionToday();
  const { entry: trainingEntry } = useDailyTrainingToday();
  const { status: weeklyStatus, checkIn: weeklyCheckIn } = useWeeklyCheckInCurrentWeek();
  const [showWeightProgress, setShowWeightProgress] = useState(false);
  const dailyEnabled = visibility?.dailyCheckinsEnabled;
  const weeklyEnabled = visibility?.weeklyCheckinsEnabled;
  const dailyCompletion = useMemo(() => {
    const input = {
      energy: dailyEntry?.energy ?? null,
      hunger: dailyEntry?.hunger ?? null,
      sleep: dailyEntry?.sleep ?? null,
      nutritionStatus: nutritionEntry?.status ?? null,
      trainingStatus: trainingEntry?.status ?? null,
    };
    const pct = calculateCompletionPercentage(input);
    const remaining = 5 - getCompletionCount(input);
    return { pct, remaining, isComplete: pct === 100 };
  }, [dailyEntry?.energy, dailyEntry?.hunger, dailyEntry?.sleep, nutritionEntry?.status, trainingEntry?.status]);
  const heroStatusItems = useMemo<UserPageHeroStatusItem[]>(() => {
    const items: UserPageHeroStatusItem[] = [];
    if (dailyEnabled) {
      items.push({
        label: 'Daily',
        value: dailyCompletion.isComplete ? '5/5 complete' : `${dailyCompletion.remaining} left`,
        tone: dailyCompletion.isComplete ? 'good' : 'warn',
      });
    }
    if (weeklyEnabled) {
      items.push({
        label: 'Weekly',
        value: weeklyStatus === 'overdue' ? 'Overdue' : weeklyStatus === 'due' ? 'Due' : 'Completed',
        tone: weeklyStatus === 'completed' ? 'good' : weeklyStatus === 'overdue' ? 'danger' : 'warn',
      });
    }
    return items;
  }, [dailyCompletion.isComplete, dailyCompletion.remaining, dailyEnabled, weeklyEnabled, weeklyStatus]);
  const weeklyActionLabel = weeklyStatus === 'completed' ? 'Edit weekly' : 'Start weekly';
  const refreshCheckIns = async () => {
    await Promise.all([
      mutate('/api/client/feature-visibility'),
      mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/user/daily-checkins')),
      mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/user/weekly-checkins')),
    ]);
  };

  if (user?.accessMode === 'SELF_SERVICE') return null;

  if (visibility && !dailyEnabled && !weeklyEnabled) {
    return (
      <div className="px-4 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-4 md:px-5">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <UserPageHero
            eyebrow="Daily rhythm"
            title="Check-Ins"
            description="Share your progress with your coach."
            icon={<Activity aria-hidden="true" focusable="false" size={17} />}
          />
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
    <PullToRefresh onRefreshAction={refreshCheckIns}>
      <div className="px-4 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] pt-4 md:px-5">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          <UserPageHero
            eyebrow="Daily rhythm"
            title="Check-Ins"
            description="Share how you are doing so your coach can guide your next step."
            icon={<Activity aria-hidden="true" focusable="false" size={17} />}
            statusItems={heroStatusItems}
          >
            {weeklyEnabled ? (
              <Link
                href="/user/check-in"
                className={`inline-flex min-h-11 items-center justify-between gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-transform active:scale-[0.99] ${
                  weeklyCheckIn
                    ? 'border border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-text)]'
                    : 'bg-[var(--color-accent)] text-white'
                }`}
              >
                <span>{weeklyActionLabel}</span>
                <ArrowRight aria-hidden="true" focusable="false" size={15} />
              </Link>
            ) : null}
          </UserPageHero>

          {dailyEnabled ? (
            <section className="space-y-3">
              <div className="px-1">
                <p className="text-sm font-semibold text-[var(--color-text)]">Daily Check-In</p>
                <p className="text-xs text-[var(--color-text-muted)]">A quick update about how your day is going.</p>
              </div>
              <DailyCheckInCard />
            </section>
          ) : null}

          {dailyEnabled && visibility?.dailyWeightEnabled ? (
            <section
              className="overflow-hidden rounded-[26px] border shadow-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              <button
                type="button"
                onClick={() => setShowWeightProgress(previous => !previous)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-alt)] sm:px-5"
                aria-expanded={showWeightProgress}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
                    <Scale aria-hidden="true" focusable="false" size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Optional
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">Weight progress</span>
                  </span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  focusable="false"
                  size={16}
                  className={`shrink-0 text-muted-foreground transition-transform ${showWeightProgress ? 'rotate-180' : ''}`}
                />
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
