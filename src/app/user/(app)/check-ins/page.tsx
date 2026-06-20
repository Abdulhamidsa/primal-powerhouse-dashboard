'use client';

import { useState } from 'react';
import { CalendarCheck2, ClipboardCheck, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { WeeklyCheckInCard } from '@/features/weekly-checkin/components/WeeklyCheckInCard';
import { DailyCheckInCard } from '@/features/daily-checkin/components/DailyCheckInCard';
import { DailyCheckInInsightsCard } from '@/features/daily-checkin/components/DailyCheckInInsightsCard';
import { useClientSelfFeatureVisibility } from '@/features/client-feature-visibility/hooks/useClientSelfFeatureVisibility';
import { useDailyCheckInToday } from '@/features/daily-checkin/hooks/useDailyCheckIn';
import { useDailyNutritionToday } from '@/features/daily-nutrition/hooks/useDailyNutrition';
import { useDailyTrainingToday } from '@/features/daily-training/hooks/useDailyTraining';
import { useMealAdherenceToday } from '@/features/adherence/hooks/useMealAdherence';
import { useWeeklyCheckInCurrentWeek } from '@/features/weekly-checkin/hooks/useWeeklyCheckIn';

type CheckInTab = 'daily' | 'weekly';

export default function UserCheckInsPage() {
  const [activeTab, setActiveTab] = useState<CheckInTab>('daily');
  const { visibility } = useClientSelfFeatureVisibility();
  const { entry: dailyEntry, isLoading: dailyLoading } = useDailyCheckInToday();
  const { entry: nutritionEntry, isLoading: nutritionLoading } = useDailyNutritionToday();
  const { entry: trainingEntry, isLoading: trainingLoading } = useDailyTrainingToday();
  const { summary: adherenceSummary, isLoading: adherenceLoading } = useMealAdherenceToday();
  const { checkIn: weeklyCheckIn, status: weeklyStatus, isLoading: weeklyLoading } = useWeeklyCheckInCurrentWeek();

  const dailyCompletionCount = [
    dailyEntry?.energy,
    dailyEntry?.hunger,
    dailyEntry?.sleep,
    nutritionEntry?.status,
    trainingEntry?.status,
  ].filter(Boolean).length;
  const isDailyComplete = dailyCompletionCount === 5;
  const isDailyLoading = dailyLoading || nutritionLoading || trainingLoading;

  // If no check-in features are enabled, show a message
  if (!visibility?.dailyCheckinsEnabled && !visibility?.weeklyCheckinsEnabled) {
    return (
      <div className="px-4 pb-8 md:px-5">
        <div className="mx-auto w-full max-w-xl space-y-6">
          <PageHeader
            title="Check-Ins"
            label="Tracking"
            description="Track your daily and weekly progress in one place."
          />
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <p style={{ color: 'var(--color-text-muted)' }}>
              Check-in features are not available at this time. Please contact your coach for more information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 md:px-5">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <PageHeader
          title="Check-Ins"
          label="Tracking"
          description="Track your daily and weekly progress in one place."
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <StatusCard
            title="Today"
            value={isDailyComplete ? 'Completed' : `${dailyCompletionCount}/5 done`}
            detail={
              isDailyComplete
                ? 'Your daily check-in is already saved.'
                : 'Open the daily check-in and finish the remaining items.'
            }
            tone={isDailyComplete ? 'good' : 'warn'}
            loading={isDailyLoading}
          />
          <StatusCard
            title="This week"
            value={weeklyCheckIn ? 'Completed' : weeklyStatus === 'overdue' ? 'Overdue' : 'Due'}
            detail={weeklyCheckIn ? 'Weekly check-in is in.' : 'Keep your weekly progress current for your coach.'}
            tone={weeklyCheckIn ? 'good' : weeklyStatus === 'overdue' ? 'warn' : 'neutral'}
            loading={weeklyLoading}
          />
          <StatusCard
            title="Meal loop"
            value={
              adherenceSummary
                ? `${adherenceSummary.completion.completedCount}/${adherenceSummary.completion.totalSelectedCount}`
                : '—'
            }
            detail={
              adherenceSummary
                ? `${adherenceSummary.completion.percentage}% of selected meals completed today`
                : 'Meal completion loads with your plan.'
            }
            tone={adherenceSummary && adherenceSummary.completion.percentage === 100 ? 'good' : 'neutral'}
            loading={adherenceLoading}
          />
        </section>

        <section className="space-y-3">
          <div className="rounded-2xl border border-border/70 bg-background/60 p-1">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns:
                  visibility?.dailyCheckinsEnabled && visibility?.weeklyCheckinsEnabled ? '1fr 1fr' : '1fr',
              }}
            >
              {visibility?.dailyCheckinsEnabled ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('daily')}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    activeTab === 'daily'
                      ? 'bg-accent/20 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                  }`}
                  aria-pressed={activeTab === 'daily'}
                >
                  <ClipboardCheck size={16} />
                  <span>Daily</span>
                </button>
              ) : null}

              {visibility?.weeklyCheckinsEnabled ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('weekly')}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    activeTab === 'weekly'
                      ? 'bg-accent/20 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                  }`}
                  aria-pressed={activeTab === 'weekly'}
                >
                  <CalendarCheck2 size={16} />
                  <span>Weekly</span>
                </button>
              ) : null}
            </div>
          </div>

          {visibility?.dailyCheckinsEnabled && activeTab === 'daily' ? (
            <div className="space-y-4">
              <div className="px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Today</p>
                <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">Daily Check-In</h3>
              </div>

              <DailyCheckInCard />

              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Sparkles size={13} className="text-muted-foreground" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Progress
                  </p>
                </div>
                <DailyCheckInInsightsCard />
              </div>
            </div>
          ) : null}

          {visibility?.weeklyCheckinsEnabled && activeTab === 'weekly' ? (
            <div className="space-y-3">
              <div className="px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">This week</p>
                <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">Weekly Check-In</h3>
              </div>
              <WeeklyCheckInCard />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function StatusCard({
  title,
  value,
  detail,
  tone,
  loading,
}: {
  title: string;
  value: string;
  detail: string;
  tone: 'good' | 'warn' | 'neutral';
  loading?: boolean;
}) {
  const toneClass =
    tone === 'good'
      ? 'border-emerald-500/15 bg-emerald-500/10 text-emerald-700'
      : tone === 'warn'
        ? 'border-amber-500/15 bg-amber-500/10 text-amber-700'
        : 'border-border bg-card text-muted-foreground';

  return (
    <div className={`rounded-[24px] border p-4 shadow-sm ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">{title}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-current">{loading ? 'Loading…' : value}</p>
      <p className="mt-1 text-xs leading-5 text-current/75">{detail}</p>
    </div>
  );
}
