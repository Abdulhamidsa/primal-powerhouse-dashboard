'use client';

import React from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../../lib/utils';
import {
  MEAL_TYPE_ORDER,
  type MealTypeKey,
  type ScalingMode,
  type SlotTargetCalculatorSettings,
  type SlotTargetPreview,
} from '../types/slotTargetCalculator.types';

const MEAL_LABELS: Record<MealTypeKey, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};

const INPUT_CLASS =
  'flex h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2';

export function SlotTargetCalculatorPanel({
  settings,
  preview,
  onTargetCaloriesChange,
  onMacroModeChange,
  onMacroFieldChange,
  onScalingModeChange,
  onDistributionChange,
  onReset,
  showTargetCaloriesInput = true,
}: {
  settings: SlotTargetCalculatorSettings;
  preview: SlotTargetPreview;
  onTargetCaloriesChange: (value: number) => void;
  onMacroModeChange: (value: 'percentage' | 'grams') => void;
  onMacroFieldChange: (
    field: 'proteinPercentage' | 'carbPercentage' | 'fatPercentage' | 'proteinGrams' | 'carbGrams' | 'fatGrams',
    value: number,
  ) => void;
  onScalingModeChange: (value: ScalingMode) => void;
  onDistributionChange: (mealType: MealTypeKey, value: number) => void;
  onReset: () => void;
  showTargetCaloriesInput?: boolean;
}) {
  const macroTargets = preview.macroTargetCalculation.targets;

  return (
    <div className="space-y-5">
      {preview.warnings.length > 0 ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-500">
          <div className="font-semibold">Calculator warnings</div>
          <ul className="mt-1 space-y-1">
            {preview.warnings.map(warning => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-4 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Target Settings</p>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Calories and macros</h3>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="h-9 rounded-md border border-[var(--color-border)] bg-transparent px-3 text-sm font-medium text-[var(--color-text)] shadow-sm transition-colors hover:bg-[var(--color-bg-alt)]"
            >
              Reset
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {showTargetCaloriesInput ? (
              <Field label="Target calories">
                <input
                  type="number"
                  min={900}
                  max={6000}
                  value={settings.targetCalories}
                  onChange={event => onTargetCaloriesChange(Number(event.target.value))}
                  className={INPUT_CLASS}
                />
              </Field>
            ) : (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-[11px] text-[var(--color-text-muted)]">Target calories</p>
                <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{settings.targetCalories}</p>
              </div>
            )}

            <Field label="Scaling mode">
              <div className="grid grid-cols-2 gap-2">
                <ToggleButton
                  active={settings.scalingMode === 'SCALE_TO_SLOT_TARGET'}
                  onClick={() => onScalingModeChange('SCALE_TO_SLOT_TARGET')}
                  label="Scale"
                />
                <ToggleButton
                  active={settings.scalingMode === 'KEEP_PORTIONS'}
                  onClick={() => onScalingModeChange('KEEP_PORTIONS')}
                  label="Keep portions"
                />
              </div>
            </Field>
          </div>

          <Field label="Macro mode">
            <div className="grid grid-cols-2 gap-2">
              <ToggleButton
                active={settings.macroMode === 'percentage'}
                onClick={() => onMacroModeChange('percentage')}
                label="Percentage"
              />
              <ToggleButton active={settings.macroMode === 'grams'} onClick={() => onMacroModeChange('grams')} label="Grams" />
            </div>
          </Field>

          {settings.macroMode === 'percentage' ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Protein %">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={settings.proteinPercentage}
                  onChange={event => onMacroFieldChange('proteinPercentage', Number(event.target.value))}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Carbs %">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={settings.carbPercentage}
                  onChange={event => onMacroFieldChange('carbPercentage', Number(event.target.value))}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Fat %">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={settings.fatPercentage}
                  onChange={event => onMacroFieldChange('fatPercentage', Number(event.target.value))}
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Protein g">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={settings.proteinGrams}
                  onChange={event => onMacroFieldChange('proteinGrams', Number(event.target.value))}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Carbs g">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={settings.carbGrams}
                  onChange={event => onMacroFieldChange('carbGrams', Number(event.target.value))}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Fat g">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={settings.fatGrams}
                  onChange={event => onMacroFieldChange('fatGrams', Number(event.target.value))}
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
          )}

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-muted)]">
            <div className="flex items-center justify-between gap-3">
              <span>Macro calories</span>
              <span className="font-medium text-[var(--color-text)]">{preview.macroTargetCalculation.totalMacroCalories} kcal</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <MiniStat label="Calories" value={`${macroTargets.calories}`} />
              <MiniStat label="Protein" value={`${macroTargets.protein}g`} />
              <MiniStat label="Carbs" value={`${macroTargets.carbs}g`} />
              <MiniStat label="Fat" value={`${macroTargets.fat}g`} />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Meal Distribution</p>
              <p className="text-sm text-[var(--color-text-muted)]">Percentages must total 100%.</p>
            </div>

            <div className="space-y-3">
              {MEAL_TYPE_ORDER.map(mealType => {
                const slotTarget = preview.slotTargets[mealType];
                return (
                  <div
                    key={mealType}
                    className="grid grid-cols-[1fr_auto_86px] items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text)]">{MEAL_LABELS[mealType]}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{slotTarget.optionCount} options</div>
                    </div>
                    <div className="text-sm font-semibold text-[var(--color-text)]">{slotTarget.calories} kcal</div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={settings.mealDistribution[mealType].percentage}
                      onChange={event => onDistributionChange(mealType, Number(event.target.value))}
                      className={INPUT_CLASS}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Preview</p>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Options by meal type</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Each option is measured independently against its slot target.</p>
          </div>

          <div className="space-y-4">
            {preview.groups.map(group => (
              <div key={group.mealType} className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-[var(--color-text)]">{MEAL_LABELS[group.mealType]}</h4>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {group.target.calories} kcal target · {group.items.length} option
                      {group.items.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-[var(--color-text)]">
                    {group.target.protein}g P · {group.target.carbs}g C · {group.target.fat}g F
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  {group.items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-5 text-sm text-[var(--color-text-muted)]">
                      No options available for this meal type.
                    </div>
                  ) : (
                    group.items.map(item => (
                      <article
                        key={`${item.sourceAssignmentId}:${item.mealId}`}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--color-text)]">{item.mealName}</p>
                            {item.mealDescription ? (
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-muted)]">
                                {item.mealDescription}
                              </p>
                            ) : null}
                          </div>
                          <div className="rounded-full bg-[var(--color-accent-translucent)] px-3 py-1 text-xs font-semibold text-[var(--color-text)]">
                            {item.overallFitScore}% fit
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <Metric label="Portion" value={`${item.portionMultiplier}x`} />
                          <Metric label="Calories" value={`${item.calculatedMacros.calories}`} />
                          <Metric label="Protein" value={`${item.calculatedMacros.protein}g`} />
                          <Metric label="Accuracy" value={`${item.calorieAccuracyPercent}%`} />
                        </div>

                        <div className="mt-3 grid gap-2 text-xs text-[var(--color-text-muted)] sm:grid-cols-2">
                          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
                            <span className="block font-medium text-[var(--color-text)]">Base macros</span>
                            <span className="block mt-1">
                              {item.baseMacros.calories} kcal · {item.baseMacros.protein}g P · {item.baseMacros.carbs}g C · {item.baseMacros.fat}g F
                            </span>
                          </div>
                          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
                            <span className="block font-medium text-[var(--color-text)]">Slot target</span>
                            <span className="block mt-1">
                              {item.slotTarget.calories} kcal · {item.slotTarget.protein}g P · {item.slotTarget.carbs}g C · {item.slotTarget.fat}g F
                            </span>
                          </div>
                        </div>

                        {item.warnings.length > 0 ? (
                          <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
                            {item.warnings.join(' · ')}
                          </div>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-sm text-[var(--color-text-muted)]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ToggleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-11 rounded-xl border px-3 text-sm font-medium transition-colors',
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-translucent)] text-[var(--color-text)]'
          : 'border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
      )}
    >
      {label}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2">
      <p className="text-[10px] text-[var(--color-text-muted)]">{label}</p>
      <p className="text-xs font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
