'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Dumbbell,
  Flame,
  MessageSquare,
  UtensilsCrossed,
  Wheat,
  Droplets,
} from 'lucide-react';
import type { TodayMissionSummary, TodayMissionTone } from '@/features/today-mission/types/todayMission.types';
import { formatMissionDelta } from '@/features/today-mission/lib/todayMission';

const TONE_STYLES: Record<TodayMissionTone, { bg: string; text: string }> = {
  neutral: { bg: 'bg-[var(--color-bg-alt)]', text: 'text-[var(--color-text-muted)]' },
  good: { bg: 'bg-[var(--color-success-muted)]', text: 'text-[var(--color-success)]' },
  warn: { bg: 'bg-[var(--color-warning-muted)]', text: 'text-[var(--color-warning)]' },
  danger: { bg: 'bg-[var(--color-danger-muted)]', text: 'text-[var(--color-danger)]' },
};

function MissionSkeleton() {
  return (
    <section className="overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5">
      <div className="h-5 w-24 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
      <div className="mt-3 h-6 w-3/4 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
      <div className="mt-2 h-4 w-full animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
      <div className="mt-6 flex items-center gap-3">
        <div className="h-24 w-24 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-full animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
          <div className="h-4 w-4/5 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-[var(--color-bg-alt)]" />
        </div>
      </div>
      <div className="mt-5 flex gap-2 overflow-hidden">
        <div className="h-20 w-40 animate-pulse rounded-[24px] bg-[var(--color-bg-alt)]" />
        <div className="h-20 w-40 animate-pulse rounded-[24px] bg-[var(--color-bg-alt)]" />
        <div className="h-20 w-40 animate-pulse rounded-[24px] bg-[var(--color-bg-alt)]" />
      </div>
    </section>
  );
}

function MissionRing({ percentage }: { percentage: number }) {
  const safePercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div
      className="relative grid h-[104px] w-[104px] place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--color-accent) ${safePercentage}%, var(--color-border) ${safePercentage}% 100%)`,
      }}
    >
      <div className="grid h-[88px] w-[88px] place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
        <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">Done</p>
        <p className="-mt-0.5 text-xl font-semibold tracking-tight text-[var(--color-text)]">{safePercentage}%</p>
      </div>
    </div>
  );
}

function MacroIcon({ label }: { label: string }) {
  if (label === 'Calories') return <Flame size={14} />;
  if (label === 'Protein') return <Dumbbell size={14} />;
  if (label === 'Carbs') return <Wheat size={14} />;
  return <Droplets size={14} />;
}

function InfoTip({ hint }: { hint: string }) {
  return (
    <button
      type="button"
      title={hint}
      aria-label={hint}
      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-border)] text-[10px] font-semibold text-[var(--color-text-muted)]"
    >
      i
    </button>
  );
}

function MacroBar({
  label,
  actual,
  target,
  unit,
  progress,
}: {
  label: string;
  actual: number;
  target: number;
  unit: string;
  progress: number;
}) {
  const width = Math.max(0, Math.min(100, progress));

  return (
    <div className="min-w-0 text-center">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{label}</p>
        <button type="button" title={`${label}: ${actual}${unit} of ${target}${unit}`} aria-label={`${label} details`}>
          <MacroIcon label={label} />
        </button>
      </div>

      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]/55">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
          style={{ width: `${width}%` }}
        />
      </div>

      <p className="mt-1 text-[13px] font-semibold text-[var(--color-text)]">
        {actual}
      </p>

      <p className="text-[10px] text-[var(--color-text-muted)]">/{target}{unit}</p>
    </div>
  );
}

function CaloriesOrbit({ actual, target, unit, progress }: { actual: number; target: number; unit: string; progress: number }) {
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <div
      className="relative grid h-[138px] w-[138px] place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--color-accent) ${safeProgress}%, color-mix(in srgb, var(--color-border) 82%, transparent) ${safeProgress}% 100%)`,
      }}
    >
      <div className="grid h-[116px] w-[116px] place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Calories</p>
        <p className="mt-0.5 text-[26px] font-semibold leading-none tracking-[-0.02em] text-[var(--color-text)]">{actual}</p>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          / {target}
          {unit}
        </p>
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
      <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5">
        <p className="text-sm font-semibold text-[var(--color-text)]">Today&apos;s Mission</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Could not load progress. {errorMessage}</p>
      </section>
    );
  }

  const badgeStyles = TONE_STYLES[summary.badgeTone];
  const caloriesMetric = summary.macros.find(metric => metric.key === 'calories');
  const macroMetrics = summary.macros.filter(metric => metric.key !== 'calories');

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5">
      <div
        className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full"
        style={{ background: 'radial-gradient(circle, var(--color-accent-muted) 0%, transparent 72%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-14 -left-12 h-44 w-44 rounded-full"
        style={{ background: 'radial-gradient(circle, var(--color-bg-alt) 0%, transparent 70%)' }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
              <UtensilsCrossed size={17} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {summary.title}
              </p>
              <h2 className="mt-1 text-[19px] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--color-text)]">
                {summary.headline}
              </h2>
            </div>
          </div>

          <p className="mt-2 max-w-[34ch] text-[12px] leading-4 text-[var(--color-text-muted)]">{summary.description}</p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${badgeStyles.bg} ${badgeStyles.text}`}
        >
          {summary.badgeTone === 'good' ? <CheckCircle2 size={12} /> : null}
          {summary.badgeTone === 'warn' ? <Flame size={12} /> : null}
          {summary.badgeTone === 'danger' ? <CalendarCheck2 size={12} /> : null}
          {summary.badgeLabel}
        </span>
      </div>

      <div className="relative mt-4 flex items-center gap-4 rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)]/75 p-3.5 backdrop-blur-[2px]">
        <MissionRing percentage={summary.mealProgress.percentage} />

        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              Mission status
            </p>
            <p className="text-[12px] font-medium text-[var(--color-text)]">
              {summary.mealProgress.completed} of {summary.mealProgress.total} meals complete
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {summary.signals.map(signal => {
              const styles = TONE_STYLES[signal.tone];

              return (
                <span
                  key={signal.label}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${styles.bg} ${styles.text}`}
                >
                  {signal.label}: {signal.value}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative mt-4 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Nutrition</p>
          </div>
          {caloriesMetric ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-medium text-[var(--color-text-muted)]">
              <Flame size={11} className="text-[var(--color-accent)]" />
              {formatMissionDelta(caloriesMetric.remaining, caloriesMetric.unit)}
            </span>
          ) : null}
        </div>

        {caloriesMetric ? (
          <div className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="flex items-center justify-between gap-3">
              <CaloriesOrbit
                actual={caloriesMetric.actual}
                target={caloriesMetric.target}
                unit={caloriesMetric.unit}
                progress={caloriesMetric.progress}
              />

              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Consumed</p>
                    <InfoTip hint="Calories from meals marked complete today." />
                  </div>
                  <p className="mt-1 text-xl font-semibold leading-none tracking-tight text-[var(--color-text)]">
                    {caloriesMetric.actual}
                    <span className="ml-1 text-xs font-medium text-[var(--color-text-muted)]">kcal</span>
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Target</p>
                    <InfoTip hint="Your meal plan target for today." />
                  </div>
                  <p className="mt-1 text-xl font-semibold leading-none tracking-tight text-[var(--color-text)]">
                    {caloriesMetric.target}
                    <span className="ml-1 text-xs font-medium text-[var(--color-text-muted)]">kcal</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-3 gap-3">
          {macroMetrics.map(metric => (
            <MacroBar
              key={metric.key}
              label={metric.label}
              actual={metric.actual}
              target={metric.target}
              unit={metric.unit}
              progress={metric.progress}
            />
          ))}
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2.5">
        <p className="truncate text-xs font-medium text-[var(--color-text)]">{summary.nextActionLabel}</p>

        <Link
          href={summary.nextActionHref}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-translucent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-accent-muted)]"
          title={summary.nextActionLabel}
        >
          Go
          <ArrowRight size={12} />
        </Link>
      </div>

      {summary.unreadCount > 0 ? (
        <Link
          href="/user/chat"
          className="relative mt-3 flex items-center justify-between gap-3 rounded-full border border-[var(--color-border)] px-3.5 py-2.5 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-alt)]"
          title="Open coach chat"
        >
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
              <MessageSquare size={14} />
            </span>
            Coach chat has {summary.unreadCount} unread message{summary.unreadCount === 1 ? '' : 's'}
          </span>
          <ArrowRight size={14} />
        </Link>
      ) : null}
    </section>
  );
}
