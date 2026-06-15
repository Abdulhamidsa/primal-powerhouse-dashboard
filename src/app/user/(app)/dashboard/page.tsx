'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { CheckCircle2, ClipboardCheck, Flame, MessageSquare, Moon, Sun, Utensils } from 'lucide-react';
import { useMotivationNotification } from '@/hooks/useMotivationNotification';
import { useUserData } from '@/hooks/useUserData';
import { useDailyCheckInInsights, useDailyCheckInToday } from '@/features/daily-checkin/hooks/useDailyCheckIn';
import { useWeeklyCheckInCurrentWeek } from '@/features/weekly-checkin/hooks/useWeeklyCheckIn';
import { useMealAdherenceToday } from '@/features/adherence/hooks/useMealAdherence';
import { useChatUnread } from '@/features/client-coach-messaging/hooks/useChatUnread';
import { TodayMissionCard, useTodayMission } from '@/features/today-mission';
import { useClientSelfFeatureVisibility } from '@/features/client-feature-visibility/hooks/useClientSelfFeatureVisibility';
import { cn } from '@/lib/utils';

type GreetingState = { text: string; icon: ReactNode };
type ActionTone = 'good' | 'warn' | 'neutral' | 'accent';

type DashboardAction = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: ActionTone;
  badge: string | null;
};

function DashboardPageSkeleton() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-3 w-20 animate-pulse rounded-full bg-muted/40" />
            <div className="h-8 w-44 animate-pulse rounded-2xl bg-muted/40" />
            <div className="h-4 w-64 max-w-full animate-pulse rounded-full bg-muted/40" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted/40" />
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="h-3 w-16 animate-pulse rounded-full bg-muted/40" />
          <div className="mt-2 h-4 w-full animate-pulse rounded-full bg-muted/40" />
          <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-muted/40" />
        </div>
      </section>

      <section className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded-full bg-muted/40" />
        <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-3">
            {[1, 2, 3, 4].map(index => (
              <div key={index} className="min-w-[128px] rounded-3xl border border-border bg-card p-4 shadow-sm">
                <div className="h-11 w-11 animate-pulse rounded-2xl bg-muted/40" />
                <div className="mt-4 h-4 w-20 animate-pulse rounded-full bg-muted/40" />
                <div className="mt-2 h-3 w-16 animate-pulse rounded-full bg-muted/40" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="h-4 w-24 animate-pulse rounded-full bg-muted/40" />
        <div className="mt-3 h-6 w-2/3 animate-pulse rounded-full bg-muted/40" />
        <div className="mt-2 h-4 w-full animate-pulse rounded-full bg-muted/40" />
        <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="h-2.5 w-full animate-pulse rounded-full bg-muted/40" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="h-10 animate-pulse rounded-2xl bg-muted/40" />
            <div className="h-10 animate-pulse rounded-2xl bg-muted/40" />
          </div>
        </div>
      </section>
    </div>
  );
}

function TodayBadge({ streakCount }: { streakCount: number }) {
  if (streakCount <= 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold text-foreground">
      <Flame size={12} className="text-primary" />
      {streakCount} day streak
    </div>
  );
}

function DashboardActionRail({ actions }: { actions: DashboardAction[] }) {
  return (
    <section className="space-y-3">
      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-3">
          {actions.map(action => {
            const Icon = action.icon;
            const toneClasses =
              action.tone === 'good'
                ? 'bg-primary/10 text-primary'
                : action.tone === 'warn'
                  ? 'bg-amber-500/10 text-amber-700'
                  : action.tone === 'accent'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted/40 text-muted-foreground';

            return (
              <Link
                key={action.key}
                href={action.href}
                className="group min-w-[128px] snap-start rounded-3xl border border-border bg-card p-4 shadow-sm transition-transform active:scale-[0.98]"
                title={`${action.title} ${action.description}`}
              >
                <div className={cn('inline-flex h-11 w-11 items-center justify-center rounded-2xl', toneClasses)}>
                  <Icon size={17} />
                </div>

                <p className="mt-4 text-sm font-semibold tracking-tight text-foreground">{action.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{action.badge ?? action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DashboardContent({
  greeting,
  firstName,
  coachMessage,
  streakCount,
}: {
  greeting: GreetingState;
  firstName: string;
  coachMessage: string;
  streakCount: number;
}) {
  const { entry: dailyEntry, isLoading: dailyLoading, error: dailyError } = useDailyCheckInToday();
  const { status: weeklyStatus, isLoading: weeklyLoading, error: weeklyError } = useWeeklyCheckInCurrentWeek();
  const { summary: adherenceSummary, isLoading: adherenceLoading, error: adherenceError } = useMealAdherenceToday();
  const { unreadTotal, isLoading: chatLoading, error: chatError } = useChatUnread();
  const { summary: todayMission, isLoading: todayMissionLoading, error: todayMissionError } = useTodayMission();
  const { visibility, isLoading: visibilityLoading, error: visibilityError } = useClientSelfFeatureVisibility();

  const isLoading =
    dailyLoading || weeklyLoading || adherenceLoading || chatLoading || todayMissionLoading || visibilityLoading;

  const errorMessage =
    dailyError?.message ??
    weeklyError?.message ??
    adherenceError?.message ??
    chatError?.message ??
    todayMissionError?.message ??
    visibilityError?.message ??
    null;

  const isDailyDone = dailyEntry?.isComplete === true;
  const completedMeals = adherenceSummary?.completion.completedCount ?? 0;
  const totalMeals = adherenceSummary?.completion.totalSelectedCount ?? 0;
  const isMealsDone = totalMeals > 0 && completedMeals === totalMeals;

  const todayActions = useMemo<DashboardAction[]>(() => {
    const actions: DashboardAction[] = [];

    if (visibility?.dailyCheckinsEnabled) {
      actions.push({
        key: 'daily',
        title: 'Daily Check-In',
        description: isDailyDone ? 'Done' : 'Due',
        href: '/user/check-ins',
        icon: CheckCircle2,
        tone: isDailyDone ? 'good' : 'warn',
        badge: isDailyDone ? 'Done' : 'Due',
      });
    }

    if (visibility?.weeklyCheckinsEnabled) {
      actions.push({
        key: 'weekly',
        title: 'Weekly Check-In',
        description: weeklyStatus === 'completed' ? 'Done' : weeklyStatus === 'overdue' ? 'Overdue' : 'Due',
        href: '/user/check-ins',
        icon: weeklyStatus === 'completed' ? CheckCircle2 : ClipboardCheck,
        tone: weeklyStatus === 'completed' ? 'good' : 'warn',
        badge: weeklyStatus === 'completed' ? 'Done' : weeklyStatus === 'overdue' ? 'Overdue' : 'Due',
      });
    }

    if (visibility?.nutritionTrackingEnabled) {
      actions.push({
        key: 'meals',
        title: "Today's Meals",
        description: totalMeals > 0 ? `${completedMeals}/${totalMeals}` : 'None',
        href: '/user/my-plan',
        icon: isMealsDone ? CheckCircle2 : Utensils,
        tone: isMealsDone ? 'good' : 'warn',
        badge: totalMeals > 0 ? `${completedMeals}/${totalMeals}` : '—',
      });
    }

    actions.push({
      key: 'chat',
      title: 'Message Coach',
      description: unreadTotal > 0 ? `${unreadTotal} new` : 'Open',
      href: '/user/chat',
      icon: MessageSquare,
      tone: unreadTotal > 0 ? 'accent' : 'neutral',
      badge: unreadTotal > 0 ? `${unreadTotal} new` : null,
    });

    return actions.slice(0, 4);
  }, [visibility, isDailyDone, weeklyStatus, totalMeals, completedMeals, isMealsDone, unreadTotal]);

  if (isLoading) {
    return <DashboardPageSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-5">
        <p className="text-sm font-semibold text-destructive">Dashboard unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
              {greeting.text},
              <br />
              {firstName}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <TodayBadge streakCount={streakCount} />
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Coach</p>
              <p className="mt-1 text-sm leading-6 text-foreground">{coachMessage}</p>
            </div>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground">
            {greeting.icon}
          </div>
        </div>
      </section>

      <DashboardActionRail actions={todayActions} />

      <section className="space-y-3">
        <TodayMissionCard summary={todayMission} />
      </section>
    </div>
  );
}

export default function UserDashboardPage() {
  const { user, error, isLoading } = useUserData();
  const { summary: insightsSummary } = useDailyCheckInInsights();
  const [greeting, setGreeting] = useState<GreetingState>({ text: '', icon: null });

  useMotivationNotification(user?.motivationalMessage);

  useEffect(() => {
    const denmarkTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
    const hour = new Date(denmarkTime).getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting({ text: 'Good Morning', icon: <Sun size={18} /> });
    } else if (hour >= 12 && hour < 18) {
      setGreeting({ text: 'Good Afternoon', icon: <Sun size={18} /> });
    } else {
      setGreeting({ text: 'Good Evening', icon: <Moon size={18} /> });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 pb-6 pt-4 md:px-5">
        <div className="mx-auto w-full max-w-xl">
          <DashboardPageSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 md:px-5">
        <div className="mx-auto w-full max-w-xl rounded-3xl border border-destructive/20 bg-destructive/10 p-5">
          <p className="text-sm font-semibold text-destructive">Error loading dashboard</p>
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Member';
  const coachMessage = user?.motivationalMessage || 'No coach message yet. Check back after your next review.';

  return (
    <div className="px-4 pb-6 pt-4 md:px-5">
      <div className="mx-auto w-full max-w-xl">
        <DashboardContent
          greeting={greeting.text ? greeting : { text: 'Good Morning', icon: <Sun size={18} /> }}
          firstName={firstName}
          coachMessage={coachMessage}
          streakCount={insightsSummary?.streakCount ?? 0}
        />
      </div>
    </div>
  );
}
