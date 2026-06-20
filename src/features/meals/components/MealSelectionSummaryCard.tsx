import type { MealSelectionInsight } from '@/features/meals/lib/mealSelectionPlanner';

export function MealSelectionSummaryCard({
  selectedCount,
  requiredSelectedCount,
  requiredCount,
  snackCount,
  snackMax,
  hasChanges = false,
  insight,
}: {
  selectedCount: number;
  requiredSelectedCount: number;
  requiredCount: number;
  snackCount: number;
  snackMax: number;
  hasChanges?: boolean;
  insight?: MealSelectionInsight;
}) {
  const completion = requiredCount > 0 ? Math.round((requiredSelectedCount / requiredCount) * 100) : 0;
  const isReady = requiredSelectedCount >= requiredCount && snackCount <= snackMax;
  const toneClass =
    insight?.tone === 'good'
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
      : insight?.tone === 'warn'
        ? 'border-amber-500/20 bg-amber-500/10 text-amber-500'
        : 'border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-text-muted)]';

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">Plan progress</h2>
          <p className="text-xs text-[var(--color-text-muted)]">Current selections and readiness</p>
        </div>
        {hasChanges ? (
          <span className="rounded-full bg-amber-500/12 px-3 py-1 text-xs font-semibold text-amber-400">Unsaved</span>
        ) : null}
      </div>

      {insight ? (
        <div className={`mt-4 rounded-2xl border px-4 py-3 ${toneClass}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">{insight.title}</p>
          <p className="mt-1 text-sm leading-6">{insight.description}</p>
          <p className="mt-1 text-xs opacity-80">{insight.helper}</p>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4">
        <div className="flex items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
          <span>{requiredSelectedCount}/{requiredCount} core meals selected</span>
          <span>{completion}% complete</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all"
            style={{ width: `${Math.min(100, completion)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total selected" value={`${selectedCount}`} detail="Meals in your draft" />
        <Metric label="Core meals" value={`${requiredSelectedCount}/${requiredCount}`} detail={isReady ? 'Ready' : 'Keep selecting'} />
        <Metric label="Snacks" value={`${snackCount}/${snackMax}`} detail={snackCount > snackMax ? 'Too many' : 'Within limit'} />
        <Metric label="Status" value={isReady ? 'Ready' : 'In progress'} detail={hasChanges ? 'Needs save' : 'Synced'} />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{value}</p>
      <p className="text-[11px] text-[var(--color-text-muted)]">{detail}</p>
    </div>
  );
}
