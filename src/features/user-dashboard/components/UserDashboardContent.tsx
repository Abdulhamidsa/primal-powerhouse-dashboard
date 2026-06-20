'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, CheckCircle2, ClipboardCheck, Dumbbell, Flame, MessageSquare, Moon, Sun, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTodayMission } from '@/features/today-mission/hooks/useTodayMission';
import { TodayMissionCard } from '@/features/today-mission/components/TodayMissionCard';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';

const ACTION_ICONS = {
  'daily-checkin': CheckCircle2,
  'weekly-checkin': ClipboardCheck,
  meals: Utensils,
  training: Dumbbell,
  messages: MessageSquare,
} as const;

type DashboardAction = UserDashboardSummary['pendingAttention']['items'][number] | UserDashboardSummary['nextAction'];

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

function StatTile({ action, emphasis }: { action: DashboardAction; emphasis?: boolean }) {
  const Icon = ACTION_ICONS[action.kind];

  return (
    <Link
      href={action.href}
      className={cn(
        'group rounded-[22px] border p-4 shadow-sm transition-transform active:scale-[0.99]',
        emphasis ? 'border-primary/30 bg-primary/5' : '',
      )}
      style={{ background: 'var(--color-surface)', borderColor: emphasis ? 'var(--color-primary-muted)' : 'var(--color-border)' }}
      title={`${action.title} ${action.description}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors',
            emphasis ? 'text-primary' : 'text-[var(--color-text-muted)]',
          )}
          style={{
            background: emphasis ? 'var(--color-accent-translucent)' : 'var(--color-bg-alt)',
            borderColor: 'var(--color-border)',
          }}
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

function ResumeCard({ action }: { action: UserDashboardSummary['resumeRoute'] }) {
  return (
    <Link
      href={action.href}
      className="group block rounded-[24px] border p-5 shadow-sm transition-transform active:scale-[0.98]"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      title={`${action.label} - ${action.description}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Next up</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{action.label}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{action.description}</p>
        </div>

        <ArrowRight
          size={15}
          className="mt-0.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      </div>

      <div className="mt-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold border-border/60 bg-background/75 text-muted-foreground">
        Resume where you left off
      </div>
    </Link>
  );
}

export function UserDashboardContent({ summary }: { summary: UserDashboardSummary }) {
  const greeting = useMemo(() => {
    const denmarkTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
    const hour = new Date(denmarkTime).getHours();

    if (hour >= 5 && hour < 12) return { text: 'Good morning', icon: <Sun size={18} /> };
    if (hour >= 12 && hour < 18) return { text: 'Good afternoon', icon: <Sun size={18} /> };
    return { text: 'Good evening', icon: <Moon size={18} /> };
  }, []);

  const { summary: todayMission } = useTodayMission(summary);
  const firstName = summary.user.name.split(' ')[0] || 'Member';
  const coachMessage = summary.user.motivationalMessage || 'No coach note yet. Check back after your next review.';
  const visibleActions = summary.pendingAttention.items.length > 0 ? summary.pendingAttention.items : [summary.nextAction];

  return (
    <div className="space-y-5 md:space-y-6">
      <section
        className="relative z-0 overflow-hidden rounded-[32px] border bg-card/75 p-5 shadow-sm backdrop-blur-xl sm:p-6"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
        />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Today</p>

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
                <p className="mt-1 text-sm text-muted-foreground">Keep it simple. One clear step at a time.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <TodayBadge streakCount={summary.streakCount} />
              <div
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {summary.todayCompletionState.label}
              </div>
              <div
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {summary.unreadTotal > 0
                  ? `${summary.unreadTotal} coach message${summary.unreadTotal === 1 ? '' : 's'} waiting`
                  : 'Coach chat quiet'}
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

      <ResumeCard action={summary.resumeRoute} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleActions.slice(0, 4).map((action, index) => (
          <StatTile key={action.key} action={action} emphasis={index === 0} />
        ))}
      </section>

      <TodayMissionCard summary={todayMission} />
    </div>
  );
}
