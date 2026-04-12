'use client';

import { useMemo } from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Props = {
  lastWeekWeight: number | null;
  currentWeight: number | null;
};

function WeightTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number | null }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-1 text-muted-foreground">
        {value == null ? 'No data' : `${value.toFixed(1)} kg`}
      </p>
    </div>
  );
}

export function WeeklyWeightLivePreview({ lastWeekWeight, currentWeight }: Props) {
  const hasBaseline = lastWeekWeight != null;
  const hasCurrent = currentWeight != null;
  const delta = hasBaseline && hasCurrent ? currentWeight - lastWeekWeight : null;

  const data = useMemo(
    () => [
      { label: 'Last week', weightKg: lastWeekWeight },
      { label: 'This week', weightKg: hasCurrent ? currentWeight : null },
    ],
    [lastWeekWeight, currentWeight, hasCurrent],
  );

  const isDown = delta != null && delta < -0.05;
  const isUp = delta != null && delta > 0.05;

  const deltaText =
    delta == null
      ? null
      : isDown
        ? `Down ${Math.abs(delta).toFixed(1)} kg`
        : isUp
          ? `Up ${delta.toFixed(1)} kg`
          : 'Stable';

  const deltaColor = isDown
    ? 'var(--color-accent)'
    : isUp
      ? 'var(--color-danger, #ef4444)'
      : 'var(--color-text-muted)';

  const DeltaIcon = isDown ? TrendingDown : isUp ? TrendingUp : Minus;

  if (!hasBaseline) {
    return (
      <div
        className="mt-3 rounded-xl border px-4 py-3 text-xs"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)' }}
      >
        No previous weight logged — graph will appear once you have a baseline.
      </div>
    );
  }

  return (
    <div
      className="mt-3 rounded-xl border p-4 space-y-2"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Weight comparison
        </span>
        {deltaText && (
          <div
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: `color-mix(in srgb, ${deltaColor} 15%, transparent)`, color: deltaColor }}
          >
            <DeltaIcon size={12} />
            {deltaText}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span>
          Last week:{' '}
          <strong style={{ color: 'var(--color-text)' }}>{lastWeekWeight.toFixed(1)} kg</strong>
        </span>
        {hasCurrent && (
          <span>
            This week:{' '}
            <strong style={{ color: deltaColor }}>{currentWeight.toFixed(1)} kg</strong>
          </span>
        )}
      </div>

      <div style={{ height: 96 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<WeightTooltip />} />
            <Line
              type="monotone"
              dataKey="weightKg"
              stroke="var(--color-accent)"
              strokeWidth={2.5}
              dot={{ r: 5, fill: 'var(--color-accent)', strokeWidth: 0 }}
              activeDot={{ r: 7 }}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
