'use client';

import Link from 'next/link';
import { useMemo, type ComponentType, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, ClipboardCheck, Flame, MessageSquare, Moon, Sun, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTodayMission } from '@/features/today-mission/hooks/useTodayMission';
import { TodayMissionCard } from '@/features/today-mission/components/TodayMissionCard';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';

type GreetingState = { text: string; icon: ReactNode };
type ActionTone = 'good' | 'warn' | 'neutral';

type DashboardAction = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: ActionTone;
};

type ResumeAction = {
  title: string;
  description: string;
  href: string;
  tone: ActionTone;
};

function TodayBadge({ streakCount }: { streakCount: number }) {
  if (streakCount <= 0) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <Flame size={12} className="text-primary" />
      {streakCount} day streak
    </div>
  );
}

function StatTile({ action }: { action: DashboardAction }) {
  const Icon = action.icon;

  const toneStyle =
    action.tone === 'good'
      ? {
          background: 'var(--color-success-muted)',
          color: 'var(--color-success)',
          borderColor: 'var(--color-success-muted)',
        }
      : action.tone === 'warn'
        ? {
            background: 'var(--color-warning-muted)',
            color: 'var(--color-warning)',
            borderColor: 'var(--color-warning-muted)',
          }
        : { background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' };

  return (
    <Link
      href={action.href}
      className="group rounded-[22px] border p-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-transform active:scale-[0.99]"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      title={`${action.title} ${action.description}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn('inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors')}
          style={toneStyle}
        >
          <Icon size={16} />
        </div>

        <ArrowRight
          size={15}
          className="mt-0.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      </div>

      <p className="mt-4 text-sm font-semibold tracking-tight text-foreground">{action.title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{action.description}</p>
    </Link>
  );
}

function ResumeCard({ action }: { action: ResumeAction }) {
  const toneClass =
    action.tone === 'good'
      ? 'border-emerald-500/15 bg-emerald-500/10 text-emerald-600'
      : action.tone === 'warn'
        ? 'border-amber-500/15 bg-amber-500/10 text-amber-700'
        : 'border-border/60 bg-background/75 text-muted-foreground';

  return (
    <Link
      href={action.href}
      className="block rounded-[24px] border p-5 shadow-sm transition-transform active:scale-[0.98]"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      title={`${action.title} - ${action.description}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Next up</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{action.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{action.description}</p>
        </div>

        <ArrowRight
          size={15}
          className="mt-0.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      </div>

      <div className={`mt-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>
        Resume where you left off
      </div>
    </Link>
  );
}

export function UserDashboardContent({ summary }: { summary: UserDashboardSummary }) {
  const greeting = useMemo<GreetingState>(() => {
    const denmarkTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
    const hour = new Date(denmarkTime).getHours();

    if (hour >= 5 && hour < 12) return { text: 'Good morning', icon: <Sun size={18} /> };
    if (hour >= 12 && hour < 18) return { text: 'Good afternoon', icon: <Sun size={18} /> };
    return { text: 'Good evening', icon: <Moon size={18} /> };
  }, []);

  const { summary: todayMission } = useTodayMission(summary);
  const firstName = summary.user.name.split(' ')[0] || 'Member';
  const coachMessage = summary.user.motivationalMessage || 'No coach note yet. Check back after your next review.';
  const resumeAction = useMemo<ResumeAction>(() => {
    if (summary.featureVisibility.dailyCheckinsEnabled && !summary.dailyCheckIn.isComplete) {
      return {
        title: "Finish today's check-in",
        description: 'Log energy, nutrition, training, hunger, and sleep before the day slips away.',
        href: '/user/check-ins',
        tone: 'warn',
      };
    }

    if (summary.featureVisibility.weeklyCheckinsEnabled && summary.weeklyCheckIn.status !== 'completed') {
      return {
        title: 'Submit weekly check-in',
        description:
          summary.weeklyCheckIn.status === 'overdue'
            ? 'Your weekly update needs attention today.'
            : 'Keep your coach updated on progress for the week.',
        href: '/user/check-ins',
        tone: summary.weeklyCheckIn.status === 'overdue' ? 'warn' : 'neutral',
      };
    }

    if (summary.featureVisibility.nutritionTrackingEnabled && summary.adherence.completion.percentage < 100) {
      return {
        title: 'Continue meal plan',
        description: `${summary.adherence.completion.completedCount}/${summary.adherence.completion.totalSelectedCount} meals completed so far.`,
        href: '/user/my-plan',
        tone: 'warn',
      };
    }

    if (summary.unreadTotal > 0) {
      return {
        title: 'Read coach messages',
        description: `${summary.unreadTotal} unread message${summary.unreadTotal === 1 ? '' : 's'} are waiting.`,
        href: '/user/chat',
        tone: 'warn',
      };
    }

    return {
      title: 'Open training',
      description: 'Keep momentum going with your workout plan and exercise videos.',
      href: '/user/training',
      tone: summary.featureVisibility.workoutTrackingEnabled ? 'good' : 'neutral',
    };
  }, [
    summary.adherence.completion.completedCount,
    summary.adherence.completion.percentage,
    summary.adherence.completion.totalSelectedCount,
    summary.dailyCheckIn.isComplete,
    summary.featureVisibility.dailyCheckinsEnabled,
    summary.featureVisibility.nutritionTrackingEnabled,
    summary.featureVisibility.weeklyCheckinsEnabled,
    summary.featureVisibility.workoutTrackingEnabled,
    summary.unreadTotal,
    summary.weeklyCheckIn.status,
  ]);

  const actions = useMemo<DashboardAction[]>(() => {
    const completion = summary.adherence.completion;
    const isDailyDone = summary.dailyCheckIn.isComplete === true;
    const weeklyStatus = summary.weeklyCheckIn.status;
    const isMealsDone =
      completion.totalSelectedCount > 0 && completion.completedCount === completion.totalSelectedCount;

    const result: DashboardAction[] = [];

    if (summary.featureVisibility.dailyCheckinsEnabled) {
      result.push({
        key: 'daily',
        title: 'Daily check-in',
        description: isDailyDone ? 'Completed for today' : "Open and complete today's check-in",
        href: '/user/check-ins',
        icon: CheckCircle2,
        tone: isDailyDone ? 'good' : 'warn',
      });
    }

    if (summary.featureVisibility.weeklyCheckinsEnabled) {
      result.push({
        key: 'weekly',
        title: 'Weekly check-in',
        description:
          weeklyStatus === 'completed'
            ? 'Submitted for this week'
            : weeklyStatus === 'overdue'
              ? 'Needs attention today'
              : 'Due this week',
        href: '/user/check-ins',
        icon: ClipboardCheck,
        tone: weeklyStatus === 'completed' ? 'good' : 'warn',
      });
    }

    if (summary.featureVisibility.nutritionTrackingEnabled) {
      result.push({
        key: 'meals',
        title: "Today's meals",
        description:
          completion.totalSelectedCount > 0
            ? isMealsDone
              ? 'All selected meals complete'
              : `${completion.completedCount}/${completion.totalSelectedCount} done`
            : 'No meals selected yet',
        href: '/user/my-plan',
        icon: Utensils,
        tone: isMealsDone ? 'good' : 'warn',
      });
    }

    result.push({
      key: 'chat',
      title: 'Message coach',
      description: summary.unreadTotal > 0 ? `${summary.unreadTotal} unread messages` : 'Open the coach chat',
      href: '/user/chat',
      icon: MessageSquare,
      tone: summary.unreadTotal > 0 ? 'warn' : 'neutral',
    });

    return result.slice(0, 4);
  }, [
    summary.adherence.completion,
    summary.dailyCheckIn.isComplete,
    summary.featureVisibility.dailyCheckinsEnabled,
    summary.featureVisibility.nutritionTrackingEnabled,
    summary.featureVisibility.weeklyCheckinsEnabled,
    summary.unreadTotal,
    summary.weeklyCheckIn.status,
  ]);

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <section
        className="relative z-0 overflow-hidden rounded-[30px] border p-5 shadow-[0_16px_50px_rgba(0,0,0,0.14)] backdrop-blur-xl"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{dateLabel}</p>

            <div className="mt-2 flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-muted-foreground shadow-sm"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
              >
                {greeting.icon}
              </div>

              <div className="min-w-0">
                <h1 className="text-[1.9rem] font-semibold tracking-tight text-foreground">
                  {greeting.text}, {firstName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your day is ready. Keep it simple, one step at a time.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <TodayBadge streakCount={summary.streakCount} />
              <div
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {summary.unreadTotal > 0
                  ? `${summary.unreadTotal} coach message${summary.unreadTotal === 1 ? '' : 's'} waiting`
                  : 'Coach chat quiet'}
              </div>
              <div
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {summary.adherence.completion.completedCount}/{summary.adherence.completion.totalSelectedCount} meals
                done
              </div>
            </div>
          </div>

          <div
            className="hidden rounded-full border p-2 text-muted-foreground shadow-sm sm:flex"
            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
          >
            {greeting.icon}
          </div>
        </div>

        <div
          className="mt-4 rounded-[24px] border p-4"
          style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Coach note</p>
          <p className="mt-2 text-sm leading-6 text-foreground">{coachMessage}</p>
        </div>
      </section>

      <div aria-hidden="true" className="h-2 md:h-4" />

      <ResumeCard action={resumeAction} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(action => (
          <StatTile key={action.key} action={action} />
        ))}
      </section>

      <TodayMissionCard summary={todayMission} />
    </div>
  );
}
