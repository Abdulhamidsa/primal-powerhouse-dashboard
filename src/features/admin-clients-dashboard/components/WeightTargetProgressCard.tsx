import {
  ArrowDownRightIcon as ArrowDownRight,
  ArrowUpRightIcon as ArrowUpRight,
  MinusIcon as Minus,
} from '@phosphor-icons/react/ssr';

function toNumber(value: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getState(
  currentWeight: number | null,
  targetWeight: number | null,
): 'on-target' | 'lose' | 'gain' | 'no-data' {
  if (currentWeight == null || targetWeight == null) return 'no-data';
  const diff = currentWeight - targetWeight;
  if (Math.abs(diff) < 0.5) return 'on-target';
  return diff > 0 ? 'lose' : 'gain';
}

export function WeightTargetProgressCard({
  currentWeight,
  targetWeight,
}: {
  currentWeight: number | null;
  targetWeight: number | null;
}) {
  const current = toNumber(currentWeight);
  const target = toNumber(targetWeight);
  const state = getState(current, target);

  const difference = current != null && target != null ? Math.abs(current - target) : null;
  const displayProgress =
    current != null && target != null && target > 0
      ? Math.max(0, Math.min(100, (Math.min(current, target) / Math.max(current, target)) * 100))
      : 0;

  const stateStyles = {
    'on-target': { color: 'var(--color-accent)', bg: 'var(--color-accent-muted)' },
    lose: { color: 'var(--color-danger)', bg: 'var(--color-danger-muted, var(--color-bg-alt))' },
    gain: { color: 'var(--color-danger)', bg: 'var(--color-danger-muted, var(--color-bg-alt))' },
    'no-data': { color: 'var(--color-text-muted)', bg: 'var(--color-bg-alt)' },
  }[state];

  const StateIcon =
    state === 'on-target' ? Minus : state === 'lose' ? ArrowDownRight : state === 'gain' ? ArrowUpRight : Minus;

  const label =
    state === 'on-target'
      ? 'On target'
      : state === 'lose'
        ? `${difference?.toFixed(1)} kg to lose`
        : state === 'gain'
          ? `${difference?.toFixed(1)} kg to gain`
          : 'Add current and target weight';

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
          Target Progress
        </h3>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ background: stateStyles.bg, color: stateStyles.color }}
        >
          <StateIcon size={12} />
          {label}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <span>Current</span>
          <span style={{ color: 'var(--color-text)' }}>{current == null ? 'N/A' : `${current.toFixed(1)} kg`}</span>
        </div>
        <div className="flex justify-between text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <span>Target</span>
          <span style={{ color: 'var(--color-text)' }}>{target == null ? 'N/A' : `${target.toFixed(1)} kg`}</span>
        </div>
      </div>

      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-alt)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${displayProgress}%`,
            background: stateStyles.color,
          }}
        />
      </div>
    </div>
  );
}
