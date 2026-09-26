'use client';

import { useEffect, useState } from 'react';
import { CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, ListBulletsIcon as LayoutList, ScalesIcon as Scale } from '@phosphor-icons/react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useDailyCheckInInsights,
  useDailyCheckInToday,
  useUpsertDailyCheckIn,
} from '@/features/daily-checkin/hooks/useDailyCheckIn';
import { useClientSelfFeatureVisibility } from '@/features/client-feature-visibility/hooks/useClientSelfFeatureVisibility';
import { formatShortDateLabel } from '@/features/daily-checkin/utils/date';
import type { DailyCheckInHistoryItem } from '@/features/daily-checkin/types/dailyCheckIn.types';
import { useUserDashboardSummary } from '@/features/user-dashboard/hooks/useUserDashboardSummary';

function parseWeightInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/,/g, '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
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
  const { dayDate, entry: todayEntry, isLoading: todayLoading } = useDailyCheckInToday();
  const { history, isLoading } = useDailyCheckInInsights();
  const { submit } = useUpsertDailyCheckIn();
  const { summary: dashboardSummary } = useUserDashboardSummary();
  const targetWeight = dashboardSummary?.user.goalWeight ?? null;

  const [weightValue, setWeightValue] = useState('');
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [viewEnd, setViewEnd] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Reset window to newest when history loads
  useEffect(() => {
    if (history.length > 0) setViewEnd(history.length);
  }, [history.length]);

  useEffect(() => {
    setWeightValue(todayEntry?.weightKg != null ? todayEntry.weightKg.toString() : '');
  }, [todayEntry?.weightKg]);

  const { visibility } = useClientSelfFeatureVisibility();

  const CHART_WINDOW = 21;
  const effectiveEnd = viewEnd ?? history.length;
  const windowStart = Math.max(0, effectiveEnd - CHART_WINDOW);

  // In overview mode use all history; otherwise use the 21-day window
  const visibleHistory = showAll ? history : history.slice(windowStart, effectiveEnd);
  // Thin out X-axis labels in overview so they don't overlap
  const allChartData = buildChartData(visibleHistory).map((d, i, arr) => ({
    ...d,
    label: showAll && arr.length > 30 && i % 7 !== 0 ? '' : d.label,
  }));
  const chartData = allChartData;
  const hasWeightData = visibleHistory.some(item => item.weightKg != null);

  const canGoBack = !showAll && windowStart > 0;
  const canGoForward = !showAll && effectiveEnd < history.length;

  function goBack() {
    setViewEnd(prev => Math.max(CHART_WINDOW, (prev ?? history.length) - 7));
  }
  function goForward() {
    setViewEnd(prev => Math.min(history.length, (prev ?? history.length) + 7));
  }

  async function saveWeight() {
    const parsedWeight = parseWeightInput(weightValue);
    const trimmedValue = weightValue.trim();
    if (trimmedValue !== '' && (parsedWeight == null || parsedWeight <= 0)) {
      setWeightError('Enter a valid weight in kilograms.');
      return;
    }

    try {
      setIsSavingWeight(true);
      setWeightError(null);
      await submit(dayDate, { weightKg: parsedWeight });
    } catch {
      setWeightError('Could not save your weight. Please try again.');
    } finally {
      setIsSavingWeight(false);
    }
  }

  return (
    <div className="rounded-3xl p-4 border border-border/70 bg-background/85 shadow-sm ">
      {/* <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-accent/10 text-accent">
              <TrendingDown size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Progress Snapshot</p>
              <p className="text-xs text-muted-foreground">Track your weight trend with less noise and clearer focus.</p>
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
      </div> */}

      {(visibility?.dailyWeightEnabled ?? true) ? (
        <div className="mt-5 rounded-2xl border border-border/70 bg-background/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Scale size={14} className="text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Weight for today</p>
            {todayEntry?.weightKg != null ? (
              <span className="ml-auto text-xs font-semibold text-accent">{todayEntry.weightKg} kg</span>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Input
              type="text"
              inputMode="decimal"
              value={weightValue}
              onChange={e => setWeightValue(e.target.value.replace(/[^0-9.,]/g, ''))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void saveWeight();
                }
              }}
              placeholder="e.g. 80,2"
              disabled={todayLoading || isSavingWeight}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void saveWeight()}
              disabled={todayLoading || isSavingWeight}
              className="shrink-0"
            >
              {isSavingWeight ? 'Saving…' : 'Save'}
            </Button>
          </div>

          {weightError ? <p className="mt-2 text-xs text-destructive">{weightError}</p> : null}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">Progress graph</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goBack}
              disabled={!canGoBack}
              aria-label="View earlier period"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] transition-opacity disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={goForward}
              disabled={!canGoForward}
              aria-label="View more recent period"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] transition-opacity disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => setShowAll(prev => !prev)}
              aria-label={showAll ? 'Switch to windowed view' : 'Show full history'}
              title={showAll ? 'Windowed view' : 'Full overview'}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-border)] transition-colors"
              style={{
                background: showAll ? 'var(--color-accent-muted)' : 'transparent',
                color: showAll ? 'var(--color-accent)' : 'var(--color-text-muted)',
                borderColor: showAll ? 'var(--color-accent)' : 'var(--color-border)',
              }}
            >
              <LayoutList size={13} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-52 w-full animate-pulse rounded-2xl border border-border/60 bg-background/50" />
        ) : hasWeightData ? (
          <div className="h-52 w-full select-none" style={{ touchAction: 'pan-y' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  tickMargin={8}
                  tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                  tickFormatter={value => `${value}`}
                  domain={[
                    (dataMin: number) => (targetWeight != null ? Math.min(dataMin - 1, targetWeight - 2) : dataMin - 1),
                    (dataMax: number) => (targetWeight != null ? Math.max(dataMax + 1, targetWeight + 2) : dataMax + 1),
                  ]}
                />

                <Tooltip
                  content={<TrendTooltip />}
                  isAnimationActive={false}
                  cursor={{
                    stroke: 'rgba(148, 163, 184, 0.45)',
                    strokeWidth: 1.5,
                  }}
                />

                <Area type="monotone" dataKey="weightKg" stroke="none" fill="url(#weightGradient)" connectNulls />

                <Line
                  type="monotone"
                  dataKey="weightKg"
                  stroke="var(--color-accent)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 7,
                    stroke: 'var(--color-surface)',
                    strokeWidth: 2.5,
                    fill: 'var(--color-accent)',
                  }}
                  connectNulls
                  isAnimationActive
                  animationDuration={700}
                />
                {targetWeight != null && (
                  <ReferenceLine
                    y={targetWeight}
                    stroke="var(--color-text-muted)"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    label={{
                      value: `Goal: ${targetWeight} kg`,
                      position: 'insideTopRight',
                      fontSize: 11,
                      fill: 'var(--color-text-muted)',
                    }}
                  />
                )}
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
