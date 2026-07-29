 'use client';

import { useMemo } from 'react';
import { CalendarClock, ChevronRight, LineChart as LineChartIcon, Target } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buildWeightProjectionTimeline } from '@/lib/health/weightProjection';
import type { AdminWeeklyCheckInListItem } from '@/features/weekly-checkin/types/adminWeeklyCheckIn.types';
import type { HealthMetricsOutput } from '@/lib/health/calculators';

type Props = {
  clientName: string;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  weeklyCheckIns: AdminWeeklyCheckInListItem[];
  healthMetrics: HealthMetricsOutput | null;
};

function TimelineTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const actual = payload.find((entry: any) => entry.dataKey === 'actualWeightKg')?.value ?? null;
  const projected = payload.find((entry: any) => entry.dataKey === 'projectedWeightKg')?.value ?? null;

  return (
    <div className="rounded-xl border bg-background px-3 py-2 text-xs shadow-lg" style={{ borderColor: 'var(--color-border)' }}>
      <p className="font-medium text-foreground">{payload[0]?.payload?.label ?? 'Date'}</p>
      {actual != null ? <p className="mt-1 text-muted-foreground">Actual: {Number(actual).toFixed(1)} kg</p> : null}
      {projected != null ? (
        <p className="mt-1 text-muted-foreground">Projected: {Number(projected).toFixed(1)} kg</p>
      ) : null}
    </div>
  );
}

function formatDateLabel(value: string | null): string {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function WeightProjectionTimelineCard({
  clientName,
  currentWeightKg,
  targetWeightKg,
  weeklyCheckIns,
  healthMetrics,
}: Props) {
  const { summary, timeline } = useMemo(
    () =>
      buildWeightProjectionTimeline({
        currentWeightKg,
        targetWeightKg,
        tdeeKgPerDay: healthMetrics?.tdee ?? null,
        goalCaloriesPerDay: healthMetrics?.recommendedCalories ?? null,
        weeklyCheckIns,
      }),
    [currentWeightKg, targetWeightKg, healthMetrics?.recommendedCalories, healthMetrics?.tdee, weeklyCheckIns],
  );

  const projectedLineData = useMemo(
    () =>
      timeline.map(point => ({
        ...point,
        projectedSeries: point.projectedWeightKg,
        actualSeries: point.actualWeightKg,
      })),
    [timeline],
  );

  const estimatedTargetLabel = formatDateLabel(summary.estimatedTargetDate);
  const isLossPlan = summary.direction === 'lose';

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Weight Timeline
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Projected weekly path for {clientName} based on the current calorie target.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}>
          <Target size={12} />
          {summary.direction === 'lose' ? 'Fat-loss plan' : summary.direction === 'gain' ? 'Gain plan' : 'Maintenance'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Metric label="Estimated arrival" value={estimatedTargetLabel} helper={summary.estimatedWeeks != null ? `${summary.estimatedWeeks} weeks` : 'No clear projection'} />
        <Metric
          label="Expected pace"
          value={
            summary.weeklyChangeKg > 0 ? `${summary.weeklyChangeKg.toFixed(1)} kg / week` : '—'
          }
          helper={
            healthMetrics?.tdee != null && healthMetrics?.recommendedCalories != null
              ? `${Math.abs(healthMetrics.tdee - healthMetrics.recommendedCalories)} kcal daily gap`
              : 'Needs a calculated health plan'
          }
        />
        <Metric
          label="Distance to target"
          value={
            currentWeightKg != null && targetWeightKg != null
              ? `${Math.abs(currentWeightKg - targetWeightKg).toFixed(1)} kg`
              : 'N/A'
          }
          helper={isLossPlan ? 'To lose' : summary.direction === 'gain' ? 'To gain' : 'On target'}
        />
      </div>

      <div className="mt-5 h-72 w-full">
        {timeline.length >= 2 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectedLineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="adminWeightProjectionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.04} />
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
                width={44}
                tickMargin={8}
                tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip content={<TimelineTooltip />} isAnimationActive={false} />
              <ReferenceLine
                y={targetWeightKg ?? undefined}
                stroke="var(--color-text-muted)"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: targetWeightKg != null ? `Target: ${targetWeightKg.toFixed(1)} kg` : '',
                  position: 'insideTopRight',
                  fontSize: 11,
                  fill: 'var(--color-text-muted)',
                }}
              />
              <Line
                type="monotone"
                dataKey="actualSeries"
                stroke="var(--color-text-muted)"
                strokeWidth={2.5}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="projectedSeries"
                stroke="var(--color-accent)"
                strokeWidth={3}
                strokeDasharray="0"
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Not enough data yet to build a timeline.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            <LineChartIcon size={12} />
            Plan snapshot
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text)' }}>
            {currentWeightKg != null && targetWeightKg != null && summary.estimatedWeeks != null
              ? `At the current plan, ${clientName} is projected to reach ${targetWeightKg.toFixed(1)} kg in about ${summary.estimatedWeeks} weeks.`
              : 'Run a health calculation to generate a projected timeline.'}
          </p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            <CalendarClock size={12} />
            Full timeline
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text)' }}>
            {summary.estimatedWeeks != null
              ? `Projected finish date: ${estimatedTargetLabel}.`
              : 'Timeline will appear once calories and target weight are set.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="mt-1 text-lg font-bold" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
      <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {helper}
      </p>
    </div>
  );
}
