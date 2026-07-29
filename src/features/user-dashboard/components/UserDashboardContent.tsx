'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, CheckCircle2, Flame, Moon, Sun } from 'lucide-react';
import { useTodayMission } from '@/features/today-mission/hooks/useTodayMission';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';

function TodayBadge({ streakCount }: { streakCount: number }) {
  if (streakCount <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold text-foreground" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
      <Flame size={12} className="text-primary" />
      {streakCount} day streak
    </span>
  );
}

function StatusItem({ label, value, complete }: { label: string; value: string; complete?: boolean }) {
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0 sm:px-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        {complete !== undefined ? <span className={`h-1.5 w-1.5 rounded-full ${complete ? 'bg-emerald-500' : 'bg-primary'}`} /> : null}
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function UserDashboardContent({ summary }: { summary: UserDashboardSummary }) {
  const greeting = useMemo(() => {
    const denmarkTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
    const hour = new Date(denmarkTime).getHours();

    if (hour >= 5 && hour < 12) return { text: 'Good morning', icon: <Sun size={17} /> };
    if (hour >= 12 && hour < 18) return { text: 'Good afternoon', icon: <Sun size={17} /> };
    return { text: 'Good evening', icon: <Moon size={17} /> };
  }, []);

  const { summary: todayMission } = useTodayMission(summary);
  const firstName = summary.user.name.split(' ')[0] || 'Member';
  const coachMessage = summary.user.motivationalMessage || 'No coach note yet. Check back after your next review.';
  const isCheckInComplete = summary.dailyCheckIn.isComplete;
  const isMealsComplete = todayMission.mealProgress.total > 0 && todayMission.mealProgress.percentage === 100;
  const primaryAction = summary.nextAction;

  return (
    <div className="space-y-3 md:space-y-4">
      <section className="relative overflow-hidden rounded-[30px] border p-5 shadow-sm backdrop-blur-xl sm:p-6" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-muted-foreground">
              {greeting.icon}
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">Today</p>
            </div>
            <h1 className="mt-2 text-[1.85rem] font-semibold leading-tight tracking-tight text-foreground">
              {greeting.text}, {firstName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">One clear step at a time.</p>
          </div>

          <TodayBadge streakCount={summary.streakCount} />
        </div>

        <div className="mt-5 border-t border-border/70 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Today&apos;s focus</p>
              <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">{todayMission.headline}</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{todayMission.description}</p>
            </div>
            <span className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
              {todayMission.badgeLabel}
            </span>
          </div>

          <Link href={primaryAction.href} className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.99]">
            <span className="truncate">{primaryAction.title}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="rounded-[26px] border px-4 py-4 shadow-sm" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your progress</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{summary.todayCompletionState.label}</p>
          </div>
          <span className="text-xs text-muted-foreground">{todayMission.mealProgress.percentage}% meals</span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--color-bg-alt)' }}>
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, todayMission.mealProgress.percentage))}%` }} />
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-border/70">
          <StatusItem label="Meals" value={`${todayMission.mealProgress.completed}/${todayMission.mealProgress.total}`} complete={isMealsComplete} />
          <StatusItem label="Check-in" value={isCheckInComplete ? 'Complete' : 'Due'} complete={isCheckInComplete} />
          <StatusItem label="Coach" value={summary.unreadTotal > 0 ? `${summary.unreadTotal} unread` : 'All clear'} complete={summary.unreadTotal === 0} />
        </div>
      </section>

      <section className="rounded-[26px] border px-4 py-3.5 shadow-sm" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--color-accent-translucent)', color: 'var(--color-accent)' }}>
            <CheckCircle2 size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Coach note</p>
            <p className="mt-1 text-sm leading-5 text-foreground">{coachMessage}</p>
          </div>
          {summary.unreadTotal > 0 ? <Link href="/user/chat" className="ml-auto shrink-0 pt-1 text-xs font-semibold text-primary">Chat</Link> : null}
        </div>
      </section>
    </div>
  );
}
