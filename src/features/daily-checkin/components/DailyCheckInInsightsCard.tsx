'use client';

import { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useDailyCheckInInsights,
  useDailyCheckInToday,
  useUpsertDailyCheckIn,
} from '@/features/daily-checkin/hooks/useDailyCheckIn';
import { formatShortDateLabel } from '@/features/daily-checkin/utils/date';
import type { DailyCheckInHistoryItem } from '@/features/daily-checkin/types/dailyCheckIn.types';

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
  const {  history, isLoading } = useDailyCheckInInsights();
  const { submit } = useUpsertDailyCheckIn();

  const [weightValue, setWeightValue] = useState('');
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [weightError, setWeightError] = useState<string | null>(null);

  useEffect(() => {
    setWeightValue(todayEntry?.weightKg != null ? todayEntry.weightKg.toString() : '');
  }, [todayEntry?.weightKg]);

  const chartData = buildChartData(history);
  const hasWeightData = history.some(item => item.weightKg != null);

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
    <div className="rounded-3xl border border-border/70 bg-background/85 p-5 shadow-sm md:p-6">
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

      <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">Progress graph</p>
          <p className="text-xs text-muted-foreground">Recent history</p>
        </div>

        {isLoading ? (
          <div className="h-52 w-full animate-pulse rounded-2xl border border-border/60 bg-background/50" />
        ) : hasWeightData ? (
          <div className="h-52 w-full">
 <ResponsiveContainer width="100%" height="100%">
  <LineChart
    data={chartData}
    margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
  >
    <defs>
      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.28} />
        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
      </linearGradient>
    </defs>

    <CartesianGrid
      stroke="rgba(148, 163, 184, 0.12)"
      strokeDasharray="3 3"
      vertical={false}
    />

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
      domain={['dataMin - 1', 'dataMax + 1']}
    />

    <Tooltip
      content={<TrendTooltip />}
      cursor={{
        stroke: 'rgba(148, 163, 184, 0.24)',
        strokeWidth: 1,
        strokeDasharray: '4 4',
      }}
    />

    <Area
      type="monotone"
      dataKey="weightKg"
      stroke="none"
      fill="url(#weightGradient)"
      connectNulls
    />

    <Line
      type="monotone"
      dataKey="weightKg"
      stroke="var(--color-accent)"
      strokeWidth={3}
      dot={false}
      activeDot={{
        r: 5,
        stroke: 'var(--color-surface)',
        strokeWidth: 2,
        fill: 'var(--color-accent)',
      }}
      connectNulls
      isAnimationActive
      animationDuration={700}
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
