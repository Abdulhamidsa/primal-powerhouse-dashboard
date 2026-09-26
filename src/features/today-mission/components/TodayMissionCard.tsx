'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRightIcon as ArrowRight, CheckCircleIcon as CheckCircle2, CalendarCheckIcon as CalendarCheck2, FlameIcon as Flame, ChatTextIcon as MessageSquare, ForkKnifeIcon as UtensilsCrossed } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TodayMissionSummary, TodayMissionTone } from '@/features/today-mission/types/todayMission.types';

const TONE_STYLES: Record<TodayMissionTone, { className: string; icon: ReactNode }> = {
  neutral: {
    className: 'border-border/60 bg-background/75 text-muted-foreground',
    icon: null,
  },
  good: {
    className: 'border-emerald-500/15 bg-emerald-500/10 text-emerald-600',
    icon: <CheckCircle2 size={12} />,
  },
  warn: {
    className: 'border-amber-500/15 bg-amber-500/10 text-amber-700',
    icon: <Flame size={12} />,
  },
  danger: {
    className: 'border-rose-500/15 bg-rose-500/10 text-rose-600',
    icon: <CalendarCheck2 size={12} />,
  },
};

function MissionSkeleton() {
  return (
    <section
      className="overflow-hidden rounded-[30px] border p-5 shadow-[0_16px_50px_rgba(0,0,0,0.14)] backdrop-blur-xl"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
          <div className="h-8 w-3/5 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
          <div className="h-4 w-11/12 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
        </div>
        <div className="h-11 w-11 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div className="h-10 w-20 animate-pulse rounded-2xl bg-[var(--color-bg-alt)]" />
          <div className="h-7 w-16 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
        </div>
        <div className="mt-4 h-2 rounded-full bg-[var(--color-bg-alt)]" />
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {[1, 2, 3].map(index => (
          <div
            key={index}
            className="rounded-[20px] border px-3 py-2.5"
            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
          >
            <div className="h-3 w-14 animate-pulse rounded-full bg-[var(--color-surface)]" />
            <div className="mt-2 h-4 w-20 animate-pulse rounded-full bg-[var(--color-surface)]" />
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="h-11 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
        <div className="h-11 w-full animate-pulse rounded-full bg-[var(--color-bg-alt)] sm:w-28" />
      </div>
    </section>
  );
}

function MissionChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: TodayMissionTone;
}) {
  const toneStyles = TONE_STYLES[tone];

  return (
    <div className={cn('rounded-[18px] border px-3 py-2.5', toneStyles.className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-current/60">{label}</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-current">
          {toneStyles.icon}
          {value}
        </span>
      </div>
    </div>
  );
}

export function TodayMissionCard({
  summary,
  isLoading = false,
  errorMessage = null,
}: {
  summary: TodayMissionSummary;
  isLoading?: boolean;
  errorMessage?: string | null;
}) {
  if (isLoading) {
    return <MissionSkeleton />;
  }

  if (errorMessage) {
    return (
      <section
        className="rounded-[30px] border p-5 shadow-[0_16px_50px_rgba(0,0,0,0.14)] backdrop-blur-xl"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <p className="text-sm font-semibold tracking-tight text-foreground">{summary.title}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Could not load progress. {errorMessage}</p>
      </section>
    );
  }

  const badgeStyles = TONE_STYLES[summary.badgeTone];
  const hasUnread = summary.unreadCount > 0;

  return (
    <section
      className="relative overflow-hidden rounded-[30px] border p-5 shadow-[0_16px_50px_rgba(0,0,0,0.14)] backdrop-blur-xl"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div
        className="pointer-events-none absolute inset-x-10 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-border) 55%, transparent), transparent)' }}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
          >
            <UtensilsCrossed size={12} className="text-muted-foreground" />
            {summary.title}
          </div>

          <h2 className="mt-3 text-[1.9rem] font-semibold tracking-tight text-foreground">{summary.headline}</h2>
          <p className="mt-2 max-w-[42ch] text-sm leading-6 text-muted-foreground">{summary.description}</p>
        </div>

        <span
          className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold')}
          style={{
            background:
              summary.badgeTone === 'good'
                ? 'var(--color-success-muted)'
                : summary.badgeTone === 'warn'
                  ? 'var(--color-warning-muted)'
                  : summary.badgeTone === 'danger'
                    ? 'var(--color-danger-muted)'
                    : 'var(--color-bg-alt)',
            color:
              summary.badgeTone === 'good'
                ? 'var(--color-success)'
                : summary.badgeTone === 'warn'
                  ? 'var(--color-warning)'
                  : summary.badgeTone === 'danger'
                    ? 'var(--color-danger)'
                    : 'var(--color-text-muted)',
            borderColor: 'var(--color-border)',
          }}
        >
          {badgeStyles.icon}
          {summary.badgeLabel}
        </span>
      </div>

      <div
        className="mt-6 rounded-[24px] border px-4 py-4"
        style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Meal progress</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              {summary.mealProgress.completed}/{summary.mealProgress.total}
            </p>
          </div>

          <div
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {summary.mealProgress.percentage}%
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: 'var(--color-bg)' }}>
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, summary.mealProgress.percentage))}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <MissionChip
          label="Check-in"
          value={summary.nutritionStatus ? 'Done' : 'Due'}
          tone={summary.nutritionStatus ? 'good' : 'warn'}
        />
        <MissionChip
          label="Meals"
          value={`${summary.mealProgress.completed}/${summary.mealProgress.total}`}
          tone={summary.mealProgress.percentage === 100 ? 'good' : summary.mealProgress.completed > 0 ? 'warn' : 'neutral'}
        />
        <MissionChip
          label="Coach"
          value={hasUnread ? `${summary.unreadCount} unread` : 'Quiet'}
          tone={hasUnread ? 'warn' : 'neutral'}
        />
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Button asChild className="h-11 rounded-full px-5 shadow-none">
          <Link href={summary.nextActionHref} title={summary.nextActionLabel}>
            <span className="truncate">{summary.nextActionLabel}</span>
            <ArrowRight size={14} />
          </Link>
        </Button>

        {hasUnread ? (
          <Button asChild variant="outline" className="h-11 rounded-full px-5 shadow-none">
            <Link href="/user/chat" title="Open coach chat">
              <MessageSquare size={14} />
              <span>Open chat</span>
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
