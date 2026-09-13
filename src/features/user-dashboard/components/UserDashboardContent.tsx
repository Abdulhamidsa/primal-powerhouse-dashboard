'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, CheckCircle2, Flame, Moon, Sun } from 'lucide-react';
import { UserPageHero } from '@/components/UserPageHero';
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
  const coachMessage = summary.user.motivationalMessage;
  const isCheckInComplete = summary.dailyCheckIn.isComplete;
  const isMealsComplete = todayMission.mealProgress.total > 0 && todayMission.mealProgress.percentage === 100;
  const primaryAction = summary.nextAction;
  const showCoachNote = Boolean(coachMessage || summary.unreadTotal > 0);

  return (
    <div className="space-y-3 md:space-y-4">
      <UserPageHero
        eyebrow="Today"
        title={`${greeting.text}, ${firstName}`}
        description="One clear step at a time."
        icon={greeting.icon}
        statusItems={[
          { label: 'Meals', value: `${todayMission.mealProgress.percentage}%`, tone: isMealsComplete ? 'good' : 'neutral' },
          { label: 'Check-in', value: isCheckInComplete ? 'Complete' : 'Due', tone: isCheckInComplete ? 'good' : 'warn' },
          { label: 'Coach', value: summary.unreadTotal > 0 ? `${summary.unreadTotal} unread` : 'All clear', tone: summary.unreadTotal > 0 ? 'warn' : 'good' },
        ]}
      >
        <div className="flex items-center justify-between gap-3">
          <TodayBadge streakCount={summary.streakCount} />
        </div>
        <div className="mt-4 border-t border-[var(--color-border)]/70 pt-4">
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
      </UserPageHero>

      {showCoachNote ? <section className="rounded-[26px] border px-4 py-3.5 shadow-sm" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--color-accent-translucent)', color: 'var(--color-accent)' }}>
            <CheckCircle2 size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Coach note</p>
            <p className="mt-1 text-sm leading-5 text-foreground">
              {coachMessage ?? 'Your coach sent a new message.'}
            </p>
          </div>
          {summary.unreadTotal > 0 ? <Link href="/user/chat" className="ml-auto shrink-0 pt-1 text-xs font-semibold text-primary">Chat</Link> : null}
        </div>
      </section> : null}
    </div>
  );
}
