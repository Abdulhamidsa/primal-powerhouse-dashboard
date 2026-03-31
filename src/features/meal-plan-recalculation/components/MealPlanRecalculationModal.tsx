'use client';

import { useMemo, useState } from 'react';
import type { ActiveMealPlanSummary } from '@/lib/client-page/types';
import { useMealPlanRecalculation } from '@/features/meal-plan-recalculation/hooks/useMealPlanRecalculation';
import type {
  MealPlanRecalculationResult,
  MealPortionDelta,
  MealSlotSummary,
  OptimizationMode,
} from '@/features/meal-plan-recalculation/types/mealPlanRecalculation.types';
import type { ApiError } from '@/lib/request';

type Props = {
  isOpen: boolean;
  onCloseAction: () => void;
  clientId: string;
  activeMealPlan: ActiveMealPlanSummary | null;
  initialCalories?: number | null;
  onOptimisticApplyStartAction?: (deltas: MealPortionDelta[]) => void;
  onOptimisticRollbackAction?: () => void;
  onAppliedAction?: () => Promise<void> | void;
};

export function MealPlanRecalculationModal({
  isOpen,
  onCloseAction,
  clientId,
  activeMealPlan,
  initialCalories,
  onOptimisticApplyStartAction,
  onOptimisticRollbackAction,
  onAppliedAction,
}: Props) {
  const [newDailyCalories, setNewDailyCalories] = useState(initialCalories ? String(initialCalories) : '');
  const [reason, setReason] = useState('');
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>('macro_optimized');
  const [previewResult, setPreviewResult] = useState<MealPlanRecalculationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { submit, isSubmitting } = useMealPlanRecalculation(clientId);

  const disabled = !activeMealPlan || isSubmitting;

  const canPreview = useMemo(() => {
    const calories = Number(newDailyCalories);
    return !disabled && Number.isFinite(calories) && calories > 0;
  }, [disabled, newDailyCalories]);

  const sortedDeltas = useMemo(
    () =>
      previewResult?.deltas.slice().sort((left, right) => {
        const order = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
        const mealTypeDiff = order.indexOf(left.mealType) - order.indexOf(right.mealType);
        if (mealTypeDiff !== 0) return mealTypeDiff;
        if (left.dayOfWeek !== right.dayOfWeek) return left.dayOfWeek - right.dayOfWeek;
        return left.mealName.localeCompare(right.mealName);
      }) ?? [],
    [previewResult],
  );

  if (!isOpen) return null;

  const handlePreview = async () => {
    if (!activeMealPlan) return;
    setErrorMessage(null);

    try {
      const result = await submit(activeMealPlan.id, {
        newDailyCalories: Number(newDailyCalories),
        reason: reason.trim() || undefined,
        mode: 'preview',
        optimizationMode,
        maxMealAdjustments: 2,
        basePlanUpdatedAt: activeMealPlan.updatedAt,
      });
      setPreviewResult(result);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || 'Failed to preview plan adjustment.');
    }
  };

  const handleApply = async () => {
    if (!activeMealPlan || !previewResult) return;
    setErrorMessage(null);
    onOptimisticApplyStartAction?.(previewResult.deltas);

    try {
      const result = await submit(activeMealPlan.id, {
        newDailyCalories: Number(newDailyCalories),
        reason: reason.trim() || undefined,
        mode: 'apply',
        optimizationMode,
        maxMealAdjustments: 2,
        basePlanUpdatedAt: previewResult.basePlanUpdatedAt,
      });

      setPreviewResult(result);
      await onAppliedAction?.();
      onCloseAction();
    } catch (error) {
      onOptimisticRollbackAction?.();
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || 'Failed to apply plan adjustment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div
        className="w-full max-w-3xl rounded-2xl border p-6 max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
              Adjust Plan Calories
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Preview slot-based portion updates first, then confirm apply.
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseAction}
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <label className="text-sm" style={{ color: 'var(--color-text)' }}>
            New Daily Calories
            <input
              type="number"
              value={newDailyCalories}
              onChange={event => setNewDailyCalories(event.target.value)}
              className="w-full mt-1 rounded-lg px-3 py-2 border"
              style={{
                background: 'var(--color-bg-alt)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              min={900}
              max={6000}
              disabled={disabled}
            />
          </label>

          <label className="text-sm" style={{ color: 'var(--color-text)' }}>
            Reason (optional)
            <input
              type="text"
              value={reason}
              onChange={event => setReason(event.target.value)}
              placeholder="Example: Weekly cut phase adjustment"
              className="w-full mt-1 rounded-lg px-3 py-2 border"
              style={{
                background: 'var(--color-bg-alt)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              maxLength={500}
              disabled={disabled}
            />
          </label>

          <label className="text-sm" style={{ color: 'var(--color-text)' }}>
            Optimization Mode
            <div
              className="mt-1 grid grid-cols-2 gap-2 rounded-lg border p-2"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <button
                type="button"
                onClick={() => setOptimizationMode('macro_optimized')}
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: optimizationMode === 'macro_optimized' ? 'var(--color-accent)' : 'var(--color-bg-alt)',
                  color: optimizationMode === 'macro_optimized' ? 'var(--color-text-black)' : 'var(--color-text-muted)',
                }}
              >
                Macro-Optimized
              </button>
              <button
                type="button"
                onClick={() => setOptimizationMode('portion_only')}
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: optimizationMode === 'portion_only' ? 'var(--color-accent)' : 'var(--color-bg-alt)',
                  color: optimizationMode === 'portion_only' ? 'var(--color-text-black)' : 'var(--color-text-muted)',
                }}
              >
                Portion Only
              </button>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Macro-optimized keeps calories close while improving protein/carbs/fat balance.
            </p>
          </label>
        </div>

        {!activeMealPlan && (
          <div
            className="p-3 rounded-lg text-sm mb-4"
            style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}
          >
            No active meal plan found for this client.
          </div>
        )}

        {errorMessage && (
          <div
            className="p-3 rounded-lg text-sm mb-4"
            style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}
          >
            {errorMessage}
          </div>
        )}

        {previewResult?.warning && (
          <div
            className="p-3 rounded-lg text-sm mb-4"
            style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}
          >
            {previewResult.warning}
          </div>
        )}

        {previewResult && (
          <div className="mb-5 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Slot Summaries
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {previewResult.slotSummaries.map(summary => (
                  <SlotSummaryCard key={summary.mealType} summary={summary} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatItem label="Daily Target kcal" value={previewResult.targets.calories} />
              <StatItem label="Daily Projected kcal" value={previewResult.projectedTotals.calories} />
              <StatItem label="Daily Target protein" value={`${previewResult.targets.protein}g`} />
              <StatItem label="Overall accuracy" value={`${previewResult.expectedAccuracyPercent.toFixed(1)}%`} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatItem
                label="Protein gap"
                value={`${previewResult.targets.protein - previewResult.projectedTotals.protein}g`}
              />
              <StatItem
                label="Carb gap"
                value={`${previewResult.targets.carbs - previewResult.projectedTotals.carbs}g`}
              />
              <StatItem label="Fat gap" value={`${previewResult.targets.fat - previewResult.projectedTotals.fat}g`} />
              <StatItem label="Adjustments" value={previewResult.adjustmentsApplied} />
            </div>

            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Meal Portion Deltas
              </p>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                <table className="w-full text-sm">
                  <thead style={{ background: 'var(--color-bg-alt)' }}>
                    <tr>
                      <th className="text-left px-3 py-2">Type</th>
                      <th className="text-left px-3 py-2">Meal</th>
                      <th className="text-left px-3 py-2">Day</th>
                      <th className="text-left px-3 py-2">Old</th>
                      <th className="text-left px-3 py-2">New</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDeltas.map(delta => (
                      <tr key={delta.assignmentId} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="px-3 py-2">{formatMealTypeLabel(delta.mealType)}</td>
                        <td className="px-3 py-2">{delta.mealName}</td>
                        <td className="px-3 py-2">{delta.dayOfWeek}</td>
                        <td className="px-3 py-2">{delta.oldPortion.toFixed(1)}x</td>
                        <td className="px-3 py-2">
                          {delta.newPortion.toFixed(1)}x{delta.wasClampedByBounds ? ' (limit)' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!canPreview}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: canPreview ? 'var(--color-accent)' : 'var(--color-bg-alt)',
              color: canPreview ? 'var(--color-text-black)' : 'var(--color-text-muted)',
            }}
          >
            {isSubmitting ? 'Working...' : 'Preview Changes'}
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!previewResult || disabled}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: previewResult && !disabled ? '#22c55e' : 'var(--color-bg-alt)',
              color: previewResult && !disabled ? 'white' : 'var(--color-text-muted)',
            }}
          >
            Confirm Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
    </div>
  );
}

function SlotSummaryCard({ summary }: { summary: MealSlotSummary }) {
  const proteinGap = summary.target.protein - summary.projected.protein;
  const carbGap = summary.target.carbs - summary.projected.carbs;
  const fatGap = summary.target.fat - summary.projected.fat;

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {formatMealTypeLabel(summary.mealType)}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {summary.included
              ? `Normalized across ${summary.coverageDays}/${summary.expectedDays} days`
              : `Skipped: ${summary.coverageDays}/${summary.expectedDays} days covered`}
          </p>
        </div>
        <p className="text-xs font-medium" style={{ color: summary.included ? 'var(--color-text)' : '#f59e0b' }}>
          {summary.included ? `${summary.expectedAccuracyPercent?.toFixed(1) ?? '0.0'}%` : 'Skipped'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <MiniStat label="Target kcal" value={summary.target.calories} />
        <MiniStat label="Projected kcal" value={summary.projected.calories} />
        <MiniStat label="Protein gap" value={`${proteinGap}g`} />
        <MiniStat label="Carb gap" value={`${carbGap}g`} />
        <MiniStat label="Fat gap" value={`${fatGap}g`} />
        <MiniStat label="Bounds" value={summary.hasBoundsClamping ? 'Limited' : 'Free'} />
      </div>

      {summary.warning && (
        <p className="text-xs" style={{ color: summary.included ? 'var(--color-text-muted)' : '#f59e0b' }}>
          {summary.warning}
        </p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
    </div>
  );
}

function formatMealTypeLabel(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
