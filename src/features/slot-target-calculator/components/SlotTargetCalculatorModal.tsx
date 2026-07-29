'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import type { MealAssignment } from '../../../lib/client-page/types';
import { useSlotTargetCalculator } from '../hooks/useSlotTargetCalculator';
import { useSlotTargetCalculatorApply } from '../hooks/useSlotTargetCalculatorApply';
import { SlotTargetCalculatorPanel } from './SlotTargetCalculatorPanel';
import type {
  MealOptionGroups,
  MealTypeKey,
  SlotTargetCalculatorSettings,
} from '../types/slotTargetCalculator.types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealAssignments?: MealAssignment[];
  clientId?: string;
  mealPlanId?: string;
  initialTargetCalories?: number;
};

export function SlotTargetCalculatorModal({
  open,
  onOpenChange,
  mealAssignments = [],
  clientId,
  mealPlanId,
  initialTargetCalories,
}: Props) {
  const optionsByType = useMemo(() => buildMealOptionGroups(mealAssignments), [mealAssignments]);
  const { settings, setSettings, updateMealDistribution, preview, resetSettings } = useSlotTargetCalculator(
    optionsByType,
    initialTargetCalories ?? 2496,
  );
  const { previewSummary, isPreviewing, isApplying, previewApply, apply, setPreviewSummary } =
    useSlotTargetCalculatorApply(mealPlanId ?? null, clientId ?? null);

  useEffect(() => {
    setPreviewSummary(null);
  }, [settings, setPreviewSummary]);

  const onMacroFieldChange = (
    field: 'proteinPercentage' | 'carbPercentage' | 'fatPercentage' | 'proteinGrams' | 'carbGrams' | 'fatGrams',
    value: number,
  ) => {
    setSettings(previous => ({ ...previous, [field]: Number.isFinite(value) ? value : 0 }));
  };

  const onTargetCaloriesChange = (value: number) => {
    setSettings(previous => {
      const nextCalories = Number.isFinite(value) ? value : 0;

      if (previous.macroMode === 'percentage') {
        return {
          ...previous,
          targetCalories: nextCalories,
          proteinGrams: Math.round((nextCalories * previous.proteinPercentage) / 100 / 4),
          carbGrams: Math.round((nextCalories * previous.carbPercentage) / 100 / 4),
          fatGrams: Math.round((nextCalories * previous.fatPercentage) / 100 / 9),
        };
      }

      return { ...previous, targetCalories: nextCalories };
    });
  };

  const onMacroModeChange = (value: 'percentage' | 'grams') => {
    setSettings(previous => ({
      ...previous,
      macroMode: value,
      ...(value === 'percentage'
        ? {
            proteinPercentage: 30,
            carbPercentage: 40,
            fatPercentage: 30,
          }
        : {
            proteinGrams: Math.round((previous.targetCalories * previous.proteinPercentage) / 100 / 4),
            carbGrams: Math.round((previous.targetCalories * previous.carbPercentage) / 100 / 4),
            fatGrams: Math.round((previous.targetCalories * previous.fatPercentage) / 100 / 9),
          }),
    }));
  };

  const onScalingModeChange = (value: 'SCALE_TO_SLOT_TARGET' | 'KEEP_PORTIONS') => {
    setSettings(previous => ({ ...previous, scalingMode: value }));
  };

  const buildApplyPayload = (): {
    clientId: string;
    selectionSetId?: string;
    applyMode: 'REWRITE_RECIPES_TO_SLOT_TARGET';
    settings: SlotTargetCalculatorSettings;
  } | null => {
    if (!clientId) return null;

    return {
      clientId,
      applyMode: 'REWRITE_RECIPES_TO_SLOT_TARGET',
      settings,
    };
  };

  const handlePreviewApply = async () => {
    const payload = buildApplyPayload();
    if (!payload) return;

    await previewApply(payload);
  };

  const handleApply = async () => {
    const payload = buildApplyPayload();
    if (!payload) return;

    await apply(payload);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-full max-w-[1180px] overflow-y-auto border border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-[var(--color-text)] sm:max-w-none">
        <div className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-5 py-4 backdrop-blur">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
              Slot Target Calculator
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[var(--color-text-muted)]">
              Preview meal options against calorie and macro targets.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 py-5">
          <SlotTargetCalculatorPanel
            settings={settings}
            preview={preview}
            onTargetCaloriesChange={onTargetCaloriesChange}
            onMacroModeChange={onMacroModeChange}
            onMacroFieldChange={onMacroFieldChange}
            onScalingModeChange={onScalingModeChange}
            onDistributionChange={updateMealDistribution}
            onReset={resetSettings}
          />

          <div className="mt-5 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  Apply to Current Plan
                </p>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Rewrite recipes to slot targets</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Create client-specific copies when needed and rewrite their macros to the slot targets.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={handlePreviewApply} disabled={!clientId || isPreviewing}>
                {isPreviewing ? 'Building summary...' : 'Preview Rewrite'}
              </Button>
              <Button
                type="button"
                onClick={handleApply}
                disabled={!clientId || isApplying || !previewSummary || previewSummary.canApply === false}
              >
                {isApplying ? 'Applying...' : 'Apply Rewrite'}
              </Button>
            </div>

            {previewSummary ? (
              <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <SummaryStat
                    label="Meal Copies"
                    value={(previewSummary.mealsToCreate ?? 0) + (previewSummary.mealsToUpdate ?? 0)}
                  />
                  <SummaryStat label="Created" value={previewSummary.mealsToCreate ?? 0} />
                  <SummaryStat label="Updated" value={previewSummary.mealsToUpdate ?? 0} />
                  <SummaryStat label="Affected" value={previewSummary.affectedMealTypes.length} />
                </div>

                {previewSummary.mealTypeSummaries.map(summary => (
                  <div
                    key={summary.mealType}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{summary.mealType}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {summary.uniqueMealCount ?? summary.optionCount} meals · {summary.assignmentsAffected ?? summary.currentAssignments} assignments
                        </p>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {summary.targetCalories} kcal · {summary.targetProtein}g P · {summary.targetCarbs}g C · {summary.targetFat}g F
                      </p>
                    </div>
                    {summary.warnings?.length ? (
                      <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
                        {summary.warnings.join(' · ')}
                      </div>
                    ) : null}
                  </div>
                ))}

                {previewSummary.warnings.length > 0 ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-500">
                    {previewSummary.warnings.map(warning => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-5 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}

function buildMealOptionGroups(mealAssignments: MealAssignment[]): MealOptionGroups {
  const grouped: MealOptionGroups = {
    BREAKFAST: [],
    LUNCH: [],
    DINNER: [],
    SNACK: [],
  };

  const seen = {
    BREAKFAST: new Set<string>(),
    LUNCH: new Set<string>(),
    DINNER: new Set<string>(),
    SNACK: new Set<string>(),
  };

  for (const assignment of mealAssignments) {
    const mealType = normalizeMealType(assignment.mealType ?? assignment.meal.type ?? '');
    if (!mealType) continue;

    const dedupeKey = `${assignment.meal.id}:${assignment.side?.id ?? 'no-side'}`;
    if (seen[mealType].has(dedupeKey)) continue;
    seen[mealType].add(dedupeKey);

    grouped[mealType].push({
      sourceAssignmentId: assignment.id,
      mealType,
      portion: assignment.portion ?? 1,
      scheduledTime: null,
      side: assignment.side
        ? {
            id: assignment.side.id,
            name: assignment.side.name,
            type: assignment.side.type,
            calories: assignment.side.calories,
            protein: assignment.side.protein,
            carbs: assignment.side.carbs,
            fat: assignment.side.fat,
            fiber: assignment.side.fiber ?? null,
            imageUrl: assignment.side.imageUrl ?? null,
            ingredients: assignment.side.ingredients,
            spices: assignment.side.spices,
            instructions: assignment.side.instructions,
            foodOrigin: assignment.side.foodOrigin ?? null,
          }
        : null,
      meal: {
        id: assignment.meal.id,
        name: assignment.meal.name,
        type: assignment.meal.type,
        description: assignment.meal.description ?? null,
        calories: assignment.meal.calories,
        protein: assignment.meal.protein,
        carbs: assignment.meal.carbs,
        fat: assignment.meal.fat,
        ingredients: null,
        spices: null,
        instructions: null,
        category: null,
        difficulty: null,
        imageUrl: null,
        prepTime: null,
        cookTime: null,
        servings: null,
        tags: null,
      },
    });
  }

  return grouped;
}

function normalizeMealType(value: string): MealTypeKey | null {
  const upper = value.toUpperCase();
  if (upper === 'BREAKFAST' || upper === 'LUNCH' || upper === 'DINNER' || upper === 'SNACK') {
    return upper;
  }

  return null;
}
