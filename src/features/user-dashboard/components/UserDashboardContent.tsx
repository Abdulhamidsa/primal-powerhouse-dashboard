'use client';

import Link from 'next/link';
import { useMemo, type ComponentType, type ReactNode } from 'react';
import { CheckCircle2, ClipboardCheck, Flame, MessageSquare, Moon, Sun, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTodayMission } from '@/features/today-mission/hooks/useTodayMission';
import { TodayMissionCard } from '@/features/today-mission/components/TodayMissionCard';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';

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

export function UserDashboardContent({ summary }: { summary: UserDashboardSummary }) {
  const greeting = useMemo<GreetingState>(() => {
    const denmarkTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
    const hour = new Date(denmarkTime).getHours();

    if (hour >= 5 && hour < 12) {
      return { text: 'Good Morning', icon: <Sun size={18} /> };
    }

    if (hour >= 12 && hour < 18) {
      return { text: 'Good Afternoon', icon: <Sun size={18} /> };
    }

    return { text: 'Good Evening', icon: <Moon size={18} /> };
  }, []);

  const { summary: todayMission } = useTodayMission(summary);
  const firstName = summary.user.name.split(' ')[0] || 'Member';
  const coachMessage = summary.user.motivationalMessage || 'No coach message yet. Check back after your next review.';

  const actions = useMemo<DashboardAction[]>(() => {
    const completion = summary.adherence.completion;
    const isDailyDone = summary.dailyCheckIn.isComplete === true;
    const weeklyStatus = summary.weeklyCheckIn.status;
    const isMealsDone = completion.totalSelectedCount > 0 && completion.completedCount === completion.totalSelectedCount;

    const result: DashboardAction[] = [];

    if (summary.featureVisibility.dailyCheckinsEnabled) {
      result.push({
        key: 'daily',
        title: 'Daily Check-In',
        description: isDailyDone ? 'Done' : 'Due',
        href: '/user/check-ins',
        icon: CheckCircle2,
        tone: isDailyDone ? 'good' : 'warn',
        badge: isDailyDone ? 'Done' : 'Due',
      });
    }

    if (summary.featureVisibility.weeklyCheckinsEnabled) {
      result.push({
        key: 'weekly',
        title: 'Weekly Check-In',
        description: weeklyStatus === 'completed' ? 'Done' : weeklyStatus === 'overdue' ? 'Overdue' : 'Due',
        href: '/user/check-ins',
        icon: weeklyStatus === 'completed' ? CheckCircle2 : ClipboardCheck,
        tone: weeklyStatus === 'completed' ? 'good' : 'warn',
        badge: weeklyStatus === 'completed' ? 'Done' : weeklyStatus === 'overdue' ? 'Overdue' : 'Due',
      });
    }

    if (summary.featureVisibility.nutritionTrackingEnabled) {
      result.push({
        key: 'meals',
        title: "Today's Meals",
        description:
          completion.totalSelectedCount > 0 ? `${completion.completedCount}/${completion.totalSelectedCount}` : 'None',
        href: '/user/my-plan',
        icon: isMealsDone ? CheckCircle2 : Utensils,
        tone: isMealsDone ? 'good' : 'warn',
        badge: completion.totalSelectedCount > 0 ? `${completion.completedCount}/${completion.totalSelectedCount}` : '—',
      });
    }

    result.push({
      key: 'chat',
      title: 'Message Coach',
      description: summary.unreadTotal > 0 ? `${summary.unreadTotal} new` : 'Open',
      href: '/user/chat',
      icon: MessageSquare,
      tone: summary.unreadTotal > 0 ? 'accent' : 'neutral',
      badge: summary.unreadTotal > 0 ? `${summary.unreadTotal} new` : null,
    });

    return result.slice(0, 4);
  }, [
    summary.dailyCheckIn.isComplete,
    summary.featureVisibility.dailyCheckinsEnabled,
    summary.featureVisibility.nutritionTrackingEnabled,
    summary.featureVisibility.weeklyCheckinsEnabled,
    summary.adherence.completion.completedCount,
    summary.adherence.completion.totalSelectedCount,
    summary.unreadTotal,
    summary.weeklyCheckIn.status,
  ]);

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
              <TodayBadge streakCount={summary.streakCount} />
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

      <DashboardActionRail actions={actions} />

      <section className="space-y-3">
        <TodayMissionCard summary={todayMission} />
      </section>
    </div>
  );
}
