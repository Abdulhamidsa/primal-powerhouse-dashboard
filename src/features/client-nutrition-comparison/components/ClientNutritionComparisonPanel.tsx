'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { useClientNutritionComparison } from '@/features/client-nutrition-comparison/hooks/useClientNutritionComparison';
import type {
  DailyNutritionComparison,
  MacroTarget,
} from '@/features/client-nutrition-comparison/types/clientNutritionComparison.types';

function formatValue(value: number, suffix = ''): string {
  return `${Math.round(value)}${suffix}`;
}

function statusLabel(status: DailyNutritionComparison['status']): string {
  if (status === 'ON_PLAN') return 'On Plan';
  if (status === 'PARTIAL') return 'Partial';
  if (status === 'OFF_PLAN') return 'Off Plan';
  return 'No Log';
}

function statusClass(status: DailyNutritionComparison['status']): string {
  if (status === 'ON_PLAN') return 'status-on-plan';
  if (status === 'PARTIAL') return 'status-partial';
  if (status === 'OFF_PLAN') return 'status-off-plan';
  return 'status-no-log';
}

function sourceLabel(source: DailyNutritionComparison['source']): string {
  if (source === 'client_goal') return 'Target source: Client goal';
  if (source === 'planned_meals') return 'Target source: Planned meals';
  return 'Target source: None';
}

function intakeSourceLabel(source: DailyNutritionComparison['intakeSource']): string {
  if (source === 'override') return 'Intake source: Manual override';
  if (source === 'auto') return 'Intake source: Completed meals';
  return 'Intake source: No meal completions';
}

function mealTypeLabel(mealType: DailyNutritionComparison['mealTimeline'][number]['mealType']): string {
  if (mealType === 'BREAKFAST') return 'Breakfast';
  if (mealType === 'LUNCH') return 'Lunch';
  if (mealType === 'DINNER') return 'Dinner';
  return 'Snack';
}

function formatCompletionTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateForUi(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function nutrientRows(_today: DailyNutritionComparison | undefined): Array<{
  key: 'calories' | 'protein' | 'carbs' | 'fat';
  label: string;
  icon: ReactNode;
  suffix: string;
}> {
  return [
    { key: 'calories', label: 'Calories', icon: <Flame size={16} />, suffix: ' kcal' },
    { key: 'protein', label: 'Protein', icon: <Beef size={16} />, suffix: ' g' },
    { key: 'carbs', label: 'Carbs', icon: <Wheat size={16} />, suffix: ' g' },
    { key: 'fat', label: 'Fat', icon: <Droplets size={16} />, suffix: ' g' },
  ];
}

function renderEmptyCard() {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        No daily nutrition logs yet. Once the client logs nutrition status, this panel will show target vs actual and
        remaining calories/macros.
      </p>
    </div>
  );
}

function renderMacroValue(target: MacroTarget | null, key: keyof MacroTarget, suffix: string): string {
  if (!target) return '—';
  return formatValue(target[key], suffix);
}

export function ClientNutritionComparisonPanel({ clientId }: { clientId: string }) {
  const { data, isLoading, error } = useClientNutritionComparison(clientId);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const weekRows = useMemo(() => {
    const rows = data?.days ?? [];
    return rows.slice(0, 7);
  }, [data?.days]);

  useEffect(() => {
    if (!selectedDateKey && data?.today?.dateKey) {
      setSelectedDateKey(data.today.dateKey);
    }
  }, [selectedDateKey, data?.today?.dateKey]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading calorie and macro comparison...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-danger)' }}>
        <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
          Failed to load calorie and macro comparison.
        </p>
      </div>
    );
  }

  const selectedRow = weekRows.find(row => row.dateKey === selectedDateKey) ?? data.today;

  return (
    <section className="space-y-4">
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Calories & Macros: Target vs Actual
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {data.estimationNote}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Day:
            </label>
            <select
              value={selectedRow.dateKey}
              onChange={event => setSelectedDateKey(event.target.value)}
              className="text-xs rounded-md border px-2 py-1"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
              }}
            >
              {weekRows.map(row => (
                <option key={row.dateKey} value={row.dateKey}>
                  {formatDateForUi(row.dateKey)}
                </option>
              ))}
            </select>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusClass(selectedRow.status)}`}>
              {statusLabel(selectedRow.status)}
            </div>
          </div>
        </div>

        <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Calculated for: {formatDateForUi(selectedRow.dateKey)}. {sourceLabel(selectedRow.source)}.{' '}
          {intakeSourceLabel(selectedRow.intakeSource)}.
        </p>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Meals completed
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {selectedRow.mealCompletionCount}/{selectedRow.mealSelectionCount}
            </p>
          </div>

          <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Completion rate
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {Math.round(selectedRow.mealCompletionPercentage)}%
            </p>
          </div>

          <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Timeline entries
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {selectedRow.mealTimeline.length}
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border p-3" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Meal completion timeline
          </p>

          {selectedRow.mealTimeline.length === 0 ? (
            <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              No meals marked as completed for this day.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {selectedRow.mealTimeline.map((entry, index) => (
                <li
                  key={`${entry.mealType}:${entry.slotIndex}:${entry.completedAt}:${index}`}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span style={{ color: 'var(--color-text)' }}>
                    {mealTypeLabel(entry.mealType)} #{entry.slotIndex + 1}
                    {entry.mealName ? ` - ${entry.mealName}` : ''}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{formatCompletionTime(entry.completedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!selectedRow.target ? (
          renderEmptyCard()
        ) : (
          <div className="space-y-3">
            {nutrientRows(selectedRow).map(row => {
              const target = selectedRow.target?.[row.key] ?? 0;
              const actual = selectedRow.actual?.[row.key] ?? null;
              const remaining = selectedRow.remaining?.[row.key] ?? null;
              const progressWidth = actual == null || target <= 0 ? 0 : Math.min(100, (actual / target) * 100);

              return (
                <div key={row.key} className="rounded-xl border p-3" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--color-text-muted)' }}>{row.icon}</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {row.label}
                      </span>
                    </div>

                    <div className="text-sm" style={{ color: 'var(--color-text)' }}>
                      <span className="font-medium">Target:</span> {formatValue(target, row.suffix)}
                    </div>

                    <div className="text-sm" style={{ color: 'var(--color-text)' }}>
                      <span className="font-medium">Actual:</span>{' '}
                      {actual == null ? '—' : formatValue(actual, row.suffix)}
                    </div>

                    <div
                      className="text-sm"
                      style={{
                        color:
                          remaining == null
                            ? 'var(--color-text-muted)'
                            : remaining >= 0
                              ? 'var(--color-accent)'
                              : 'var(--color-danger)',
                      }}
                    >
                      <span className="font-medium">Remaining:</span>{' '}
                      {remaining == null ? '—' : formatValue(remaining, row.suffix)}
                    </div>
                  </div>

                  <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-alt)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${progressWidth}%`,
                        background:
                          remaining == null
                            ? 'var(--color-text-muted)'
                            : remaining >= 0
                              ? 'var(--color-accent)'
                              : 'var(--color-danger)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h4 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Last 7 Days (Calories)
          </h4>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Avg Target: {data.summary.avgTargetCalories ?? '—'} kcal | Avg Actual:{' '}
            {data.summary.avgActualCalories ?? '—'} kcal | Avg Remaining: {data.summary.avgRemainingCalories ?? '—'}{' '}
            kcal
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Meals</th>
                <th className="text-left py-2">Target</th>
                <th className="text-left py-2">Actual</th>
                <th className="text-left py-2">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {weekRows.map(row => (
                <tr
                  key={row.dateKey}
                  className="border-b cursor-pointer"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: row.dateKey === selectedRow.dateKey ? 'var(--color-bg-alt)' : 'transparent',
                  }}
                  onClick={() => setSelectedDateKey(row.dateKey)}
                >
                  <td className="py-2" style={{ color: 'var(--color-text)' }}>
                    {formatDateForUi(row.dateKey)}
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${statusClass(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="py-2" style={{ color: 'var(--color-text)' }}>
                    {row.mealCompletionCount}/{row.mealSelectionCount}
                  </td>
                  <td className="py-2" style={{ color: 'var(--color-text)' }}>
                    {renderMacroValue(row.target, 'calories', ' kcal')}
                  </td>
                  <td className="py-2" style={{ color: 'var(--color-text)' }}>
                    {renderMacroValue(row.actual, 'calories', ' kcal')}
                  </td>
                  <td className="py-2" style={{ color: 'var(--color-text)' }}>
                    {renderMacroValue(row.remaining, 'calories', ' kcal')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .status-on-plan {
          background: var(--color-accent-muted);
          color: var(--color-accent);
          border-color: var(--color-accent);
        }

        .status-partial {
          background: var(--color-bg-alt);
          color: var(--color-text);
          border-color: var(--color-border);
        }

        .status-off-plan {
          background: var(--color-bg-alt);
          color: var(--color-danger);
          border-color: var(--color-danger);
        }

        .status-no-log {
          background: var(--color-bg-alt);
          color: var(--color-text-muted);
          border-color: var(--color-border);
        }
      `}</style>
    </section>
  );
}
