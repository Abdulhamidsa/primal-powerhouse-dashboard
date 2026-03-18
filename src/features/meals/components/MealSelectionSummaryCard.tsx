import type { MealMacroTotals } from '@/features/meals/types/mealSelection.types';

function deltaTone(value: number): 'match' | 'over' | 'under' {
  if (value === 0) return 'match';
  return value > 0 ? 'over' : 'under';
}

function toneClasses(tone: 'match' | 'over' | 'under') {
  if (tone === 'match') return 'text-emerald-600';
  if (tone === 'over') return 'text-amber-600';
  return 'text-sky-600';
}

function formatDelta(value: number, suffix = '') {
  if (value === 0) return `Match${suffix}`;
  return `${value > 0 ? '+' : ''}${value}${suffix}`;
}

export function MealSelectionSummaryCard({
  selected,
  baseline,
  delta,
}: {
  selected: MealMacroTotals;
  baseline: MealMacroTotals;
  delta: MealMacroTotals;
}) {
  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">Nutrition Match</h2>
          <p className="text-xs text-[var(--color-text-muted)]">Selected vs coach-assigned baseline</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Calories" selected={selected.calories} baseline={baseline.calories} delta={delta.calories} />
        <Metric label="Protein" selected={selected.protein} baseline={baseline.protein} delta={delta.protein} unit="g" />
        <Metric label="Carbs" selected={selected.carbs} baseline={baseline.carbs} delta={delta.carbs} unit="g" />
        <Metric label="Fat" selected={selected.fat} baseline={baseline.fat} delta={delta.fat} unit="g" />
      </div>
    </section>
  );
}

function Metric({
  label,
  selected,
  baseline,
  delta,
  unit = '',
}: {
  label: string;
  selected: number;
  baseline: number;
  delta: number;
  unit?: string;
}) {
  const tone = deltaTone(delta);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{selected}{unit}</p>
      <p className="text-[11px] text-[var(--color-text-muted)]">Baseline {baseline}{unit}</p>
      <p className={`mt-1 text-[11px] font-medium ${toneClasses(tone)}`}>{formatDelta(delta, unit)}</p>
    </div>
  );
}
