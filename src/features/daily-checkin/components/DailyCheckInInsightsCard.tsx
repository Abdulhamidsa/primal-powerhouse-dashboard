'use client';

import { ArrowDown, ArrowRight, ArrowUp, TrendingDown } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDailyCheckInInsights } from '@/features/daily-checkin/hooks/useDailyCheckIn';
import { formatShortDateLabel } from '@/features/daily-checkin/utils/date';
import type { DailyCheckInHistoryItem } from '@/features/daily-checkin/types/dailyCheckIn.types';

function formatWeight(value: number | null): string {
  return value == null ? '--' : `${value.toFixed(1)} kg`;
}

function formatTrend(delta: number | null): string {
  if (delta == null || Math.abs(delta) < 0.05) {
    return 'No clear shift this week';
  }

  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg this week`;
}

function trendIcon(direction: 'down' | 'stable' | 'up') {
  if (direction === 'down') return <ArrowDown size={15} className="text-emerald-500" />;
  if (direction === 'up') return <ArrowUp size={15} className="text-amber-500" />;
  return <ArrowRight size={15} className="text-muted-foreground" />;
}

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = payload[0]?.value as number | null;

  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-1 text-muted-foreground">{value == null ? 'No weight logged' : `${value.toFixed(1)} kg`}</p>
    </div>
  );
}

function buildChartData(history: DailyCheckInHistoryItem[]) {
  return history.map(item => ({
    label: formatShortDateLabel(item.dayDate),
    dayDate: item.dayDate,
    weightKg: item.weightKg,
  }));
}

export function DailyCheckInInsightsCard() {
  const { summary, history, isLoading } = useDailyCheckInInsights();

  const chartData = buildChartData(history);
  const hasWeightData = history.some(item => item.weightKg != null);

  return (
    <div className="rounded-3xl border border-border/70 bg-background/85 p-5 shadow-sm md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-accent/10 text-accent">
              <TrendingDown size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Progress Snapshot</p>
              <p className="text-xs text-muted-foreground">
                Weight context, compliance, and streaks without extra filler.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2 text-right">
          <div className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
            Weekly compliance{' '}
            <span className="font-semibold text-foreground">
              {summary ? `${summary.weeklyCompliancePercentage}%` : '--'}
            </span>
          </div>
          <div className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
            Streak{' '}
            <span className="font-semibold text-foreground">{summary ? `${summary.streakCount} days` : '--'}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Weight Today</p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            {isLoading ? 'Loading...' : formatWeight(summary?.weightToday ?? null)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">7-Day Average</p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            {isLoading ? 'Loading...' : formatWeight(summary?.currentSevenDayAverage ?? null)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Trend</p>
          <div className="mt-2 flex items-center gap-2 text-foreground">
            {summary ? trendIcon(summary.trendDirection) : <ArrowRight size={15} className="text-muted-foreground" />}
            <p className="text-lg font-semibold">
              {isLoading ? 'Loading...' : formatTrend(summary?.trendDeltaKg ?? null)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border/70 bg-background/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">Weight Trend</p>
          <p className="text-xs text-muted-foreground">Recent history</p>
        </div>

        {hasWeightData ? (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                  tickFormatter={value => `${value}`}
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                />
                <Tooltip content={<TrendTooltip />} />
                <Line
                  type="monotone"
                  dataKey="weightKg"
                  stroke="var(--color-accent)"
                  strokeWidth={3}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/40">
            <p className="text-sm text-muted-foreground">Log a few weights to unlock your trend chart.</p>
          </div>
        )}
      </div>
    </div>
  );
}
