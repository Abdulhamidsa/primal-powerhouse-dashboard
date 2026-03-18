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
  target,
  delta,
  subtle = false,
}: {
  selected: MealMacroTotals;
  target: MealMacroTotals;
  delta: MealMacroTotals;
  subtle?: boolean;
}) {
  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">Nutrition</h2>
          <p className="text-xs text-[var(--color-text-muted)]">Selected totals and coach targets</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Calories" selected={selected.calories} target={target.calories} delta={delta.calories} subtle={subtle} />
        <Metric label="Protein" selected={selected.protein} target={target.protein} delta={delta.protein} unit="g" subtle={subtle} />
        <Metric label="Carbs" selected={selected.carbs} target={target.carbs} delta={delta.carbs} unit="g" subtle={subtle} />
        <Metric label="Fat" selected={selected.fat} target={target.fat} delta={delta.fat} unit="g" subtle={subtle} />
      </div>
    </section>
  );
}

function Metric({
  label,
  selected,
  target,
  delta,
  unit = '',
  subtle = false,
}: {
  label: string;
  selected: number;
  target: number;
  delta: number;
  unit?: string;
  subtle?: boolean;
}) {
  const tone = deltaTone(delta);
  const deltaClass = subtle ? 'text-[var(--color-text-muted)]' : toneClasses(tone);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{selected}{unit}</p>
      <p className="text-[11px] text-[var(--color-text-muted)]">Target {target}{unit}</p>
      <p className={`mt-1 text-[11px] font-medium ${deltaClass}`}>{formatDelta(delta, unit)}</p>
    </div>
  );
}
