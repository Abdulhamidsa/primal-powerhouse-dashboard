'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarCheck2, CheckCircle2, Flame, MessageSquare, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TodayMissionSummary, TodayMissionTone } from '@/features/today-mission/types/todayMission.types';

const TONE_STYLES: Record<TodayMissionTone, { className: string; icon: ReactNode }> = {
  neutral: {
    className: 'border-border bg-muted/40 text-muted-foreground',
    icon: null,
  },
  good: {
    className: 'border-border bg-muted/40 text-foreground',
    icon: <CheckCircle2 size={12} />,
  },
  warn: {
    className: 'border-border bg-muted/40 text-foreground',
    icon: <Flame size={12} />,
  },
  danger: {
    className: 'border-destructive/20 bg-destructive/10 text-destructive',
    icon: <CalendarCheck2 size={12} />,
  },
};

function MissionSkeleton() {
  return (
    <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
      <CardContent className="p-4 md:p-5">
        <div className="h-4 w-20 animate-pulse rounded-full bg-muted/40" />
        <div className="mt-3 h-6 w-2/3 animate-pulse rounded-full bg-muted/40" />
        <div className="mt-2 h-4 w-11/12 animate-pulse rounded-full bg-muted/40" />

        <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 animate-pulse rounded-2xl bg-muted/40" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full animate-pulse rounded-full bg-muted/40" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-muted/40" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-hidden">
          <div className="h-16 w-28 animate-pulse rounded-2xl bg-muted/40" />
          <div className="h-16 w-28 animate-pulse rounded-2xl bg-muted/40" />
          <div className="h-16 w-28 animate-pulse rounded-2xl bg-muted/40" />
        </div>
      </CardContent>
    </Card>
  );
}

function MissionProgress({ percentage }: { percentage: number }) {
  const safePercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Progress</p>
          <p className="mt-1 text-2xl font-semibold leading-none tracking-tight text-foreground">{safePercentage}%</p>
        </div>

        <div className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
          Today
        </div>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{
            width: `${safePercentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function TonePill({ label, value, tone }: { label: string; value: string; tone: TodayMissionTone }) {
  const toneStyles = TONE_STYLES[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium',
        toneStyles.className
      )}
    >
      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1 font-semibold">
        {toneStyles.icon}
        {value}
      </span>
    </span>
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
      <Card className="rounded-3xl border-border bg-card shadow-sm">
        <CardContent className="p-4 md:p-5">
          <p className="text-sm font-semibold tracking-tight text-foreground">Today&apos;s Mission</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Could not load progress. {errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  const badgeStyles = TONE_STYLES[summary.badgeTone];

  return (
    <Card className="relative overflow-hidden rounded-3xl border-border bg-card shadow-sm">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-muted/60 blur-3xl" />

      <CardContent className="relative p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-muted/40 text-foreground">
                <UtensilsCrossed size={17} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {summary.title}
                </p>
                <h2 className="mt-1 text-[21px] font-semibold leading-tight tracking-tight text-foreground">
                  {summary.headline}
                </h2>
              </div>
            </div>

            <p className="mt-2 max-w-[38ch] text-sm leading-6 text-muted-foreground">{summary.description}</p>
          </div>

          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold',
              badgeStyles.className
            )}
          >
            {summary.badgeTone === 'good' ? <CheckCircle2 size={12} /> : null}
            {summary.badgeTone === 'warn' ? <Flame size={12} /> : null}
            {summary.badgeTone === 'danger' ? <CalendarCheck2 size={12} /> : null}
            {summary.badgeLabel}
          </span>
        </div>

        <div className="mt-4 space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
          <MissionProgress percentage={summary.mealProgress.percentage} />

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">Meals completed</p>
              <p className="text-xs font-semibold text-foreground">
                {summary.mealProgress.completed} of {summary.mealProgress.total}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">Mission status</p>
              <p className="text-xs font-semibold text-foreground">{summary.mealProgress.percentage}% complete</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {summary.signals.map(signal => (
              <TonePill key={signal.label} label={signal.label} value={signal.value} tone={signal.tone} />
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-background px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Next step</p>
              <p className="mt-1 truncate text-sm font-medium text-foreground">{summary.nextActionLabel}</p>
            </div>

            <Button asChild size="sm" className="rounded-full px-4">
              <Link href={summary.nextActionHref} title={summary.nextActionLabel}>
                Open
                <ArrowRight size={12} />
              </Link>
            </Button>
          </div>
        </div>

        {summary.unreadCount > 0 ? (
          <Button
            asChild
            variant="outline"
            className="mt-3 h-auto w-full justify-between rounded-2xl px-4 py-3 text-left"
          >
            <Link href="/user/chat" title="Open coach chat">
              <span className="inline-flex min-w-0 items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MessageSquare size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">Coach chat</span>
                  <span className="block text-xs text-muted-foreground">
                    {summary.unreadCount} unread message{summary.unreadCount === 1 ? '' : 's'}
                  </span>
                </span>
              </span>
              <ArrowRight size={14} className="text-muted-foreground" />
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
