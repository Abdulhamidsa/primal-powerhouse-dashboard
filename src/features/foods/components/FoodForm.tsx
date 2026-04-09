'use client';

import { useEffect, useMemo, useState } from 'react';
import { createFoodSchema } from '@/features/foods/schemas/food.schema';
import { useCreateFood } from '@/features/foods/hooks/useFoods';
import type { FoodRecord } from '@/features/foods/types/food.types';

export type FoodFormPrefill = Partial<{
  name: string;
  category: (typeof categoryOptions)[number];
  state: (typeof stateOptions)[number];
  caloriesKcal: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  fiberG: string;
  baseUnit: '100g' | 'unit';
  gramsPerUnit: string;
  displayUnitLabel: string;
  sourceRef: string;
  source: (typeof sourceOptions)[number];
  isActive: boolean;
  verifiedBy: string;
  verifiedAt: string;
}>;

function buildInitialFormData(prefill?: FoodFormPrefill) {
  return {
    name: prefill?.name ?? '',
    category: prefill?.category ?? ('protein' as (typeof categoryOptions)[number]),
    state: prefill?.state ?? ('raw' as (typeof stateOptions)[number]),
    caloriesKcal: prefill?.caloriesKcal ?? '',
    proteinG: prefill?.proteinG ?? '',
    carbsG: prefill?.carbsG ?? '',
    fatG: prefill?.fatG ?? '',
    fiberG: prefill?.fiberG ?? '',
    baseUnit: prefill?.baseUnit ?? ('100g' as '100g' | 'unit'),
    gramsPerUnit: prefill?.gramsPerUnit ?? '',
    displayUnitLabel: prefill?.displayUnitLabel ?? '',
    sourceRef: prefill?.sourceRef ?? '',
    source: prefill?.source ?? ('custom' as (typeof sourceOptions)[number]),
    isActive: prefill?.isActive ?? true,
    verifiedBy: prefill?.verifiedBy ?? '',
    verifiedAt: prefill?.verifiedAt ?? '',
  };
}

type FoodFormProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  onCreatedAction?: (createdFood?: FoodRecord) => void;
  prefill?: FoodFormPrefill | null;
};

const categoryOptions = ['protein', 'carb', 'fat', 'dairy', 'fruit', 'vegetable', 'extra'] as const;
const stateOptions = ['raw', 'dry', 'as_sold', 'cooked'] as const;
const sourceOptions = ['custom', 'system'] as const;

export default function FoodForm({ isOpen, onCloseAction, onCreatedAction, prefill }: FoodFormProps) {
  const { submit } = useCreateFood();
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [formData, setFormData] = useState(buildInitialFormData(prefill ?? undefined));

  useEffect(() => {
    if (!isOpen) return;
    setFormError('');
    setFormData(buildInitialFormData(prefill ?? undefined));
  }, [isOpen, prefill]);

  const parsedPreview = useMemo(() => {
    const payload = {
      name: formData.name,
      category: formData.category,
      state: formData.state,
      caloriesKcal: Number(formData.caloriesKcal),
      proteinG: Number(formData.proteinG),
      carbsG: Number(formData.carbsG),
      fatG: Number(formData.fatG),
      fiberG: formData.fiberG ? Number(formData.fiberG) : null,
      source: formData.source,
      isActive: formData.isActive,
      sourceRef: formData.sourceRef.trim() ? formData.sourceRef.trim() : null,
      verifiedAt: formData.verifiedAt ? new Date(formData.verifiedAt).toISOString() : null,
      verifiedBy: formData.verifiedBy.trim() ? formData.verifiedBy.trim() : null,
      baseUnit: formData.baseUnit,
      gramsPerUnit: formData.baseUnit === 'unit' ? Number(formData.gramsPerUnit) : null,
      displayUnitLabel: formData.baseUnit === 'unit' ? formData.displayUnitLabel.trim() || null : null,
    };

    return createFoodSchema.safeParse(payload);
  }, [formData]);

  if (!isOpen) return null;

  const reset = () => {
    setFormError('');
    setFormData(buildInitialFormData());
  };

  const handleClose = () => {
    reset();
    onCloseAction();
  };

  const handleSave = async () => {
    if (!parsedPreview.success) {
      const first = parsedPreview.error.issues[0];
      setFormError(first?.message ?? 'Please check the form values');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      const created = await submit(parsedPreview.data);
      onCreatedAction?.(created);
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create ingredient');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div
        className="flex w-full max-w-3xl flex-col rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        style={{ maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-5">
          <div>
            <h3 className="text-foreground">Add Ingredient</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Add a new ingredient to your internal food database.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            aria-label="Close"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {formError && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {formError}
            </div>
          )}

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">Basic Information</h4>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Core details for the ingredient record.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">Name</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-base w-full"
                  placeholder="e.g., Chicken breast"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">Category</label>
                <select
                  value={formData.category}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, category: e.target.value as (typeof categoryOptions)[number] }))
                  }
                  className="input-base w-full appearance-none"
                >
                  {categoryOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">Nutrition Per Base Unit</h4>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Enter the nutrition values for this ingredient.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">kcal</label>
                <input
                  type="number"
                  value={formData.caloriesKcal}
                  onChange={e => setFormData(prev => ({ ...prev, caloriesKcal: e.target.value }))}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">Protein</label>
                <input
                  type="number"
                  value={formData.proteinG}
                  onChange={e => setFormData(prev => ({ ...prev, proteinG: e.target.value }))}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">Carbs</label>
                <input
                  type="number"
                  value={formData.carbsG}
                  onChange={e => setFormData(prev => ({ ...prev, carbsG: e.target.value }))}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">Fat</label>
                <input
                  type="number"
                  value={formData.fatG}
                  onChange={e => setFormData(prev => ({ ...prev, fatG: e.target.value }))}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">Fiber</label>
                <input
                  type="number"
                  value={formData.fiberG}
                  onChange={e => setFormData(prev => ({ ...prev, fiberG: e.target.value }))}
                  className="input-base w-full"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">Configuration</h4>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Choose how the ingredient should be measured and stored.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">State</label>
                <select
                  value={formData.state}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, state: e.target.value as (typeof stateOptions)[number] }))
                  }
                  className="input-base w-full appearance-none"
                >
                  {stateOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">Base Unit</label>
                <select
                  value={formData.baseUnit}
                  onChange={e => setFormData(prev => ({ ...prev, baseUnit: e.target.value as '100g' | 'unit' }))}
                  className="input-base w-full appearance-none"
                >
                  <option value="100g">100g</option>
                  <option value="unit">unit</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">Source Ref (optional)</label>
                <input
                  value={formData.sourceRef}
                  onChange={e => setFormData(prev => ({ ...prev, sourceRef: e.target.value }))}
                  className="input-base w-full"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">Verification</h4>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Optional source and verification metadata.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">Source</label>
                <select
                  value={formData.source}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, source: e.target.value as (typeof sourceOptions)[number] }))
                  }
                  className="input-base w-full appearance-none"
                >
                  {sourceOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">
                  Verified By (optional)
                </label>
                <input
                  value={formData.verifiedBy}
                  onChange={e => setFormData(prev => ({ ...prev, verifiedBy: e.target.value }))}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">
                  Verified At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.verifiedAt}
                  onChange={e => setFormData(prev => ({ ...prev, verifiedAt: e.target.value }))}
                  className="input-base w-full"
                />
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  Active
                </label>
              </div>
            </div>
          </section>

          {formData.baseUnit === 'unit' && (
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">Unit Details</h4>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Define how one unit converts to grams.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">Grams Per Unit</label>
                  <input
                    type="number"
                    value={formData.gramsPerUnit}
                    onChange={e => setFormData(prev => ({ ...prev, gramsPerUnit: e.target.value }))}
                    className="input-base w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">Unit Label</label>
                  <input
                    value={formData.displayUnitLabel}
                    onChange={e => setFormData(prev => ({ ...prev, displayUnitLabel: e.target.value }))}
                    placeholder="e.g., egg, scoop, tortilla"
                    className="input-base w-full"
                  />
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-5 py-5">
          <button type="button" onClick={handleClose} className="btn-secondary">
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary bg-[var(--color-accent)] text-[var(--color-text-on-accent)] hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Ingredient'}
          </button>
        </div>
      </div>
    </div>
  );
}
