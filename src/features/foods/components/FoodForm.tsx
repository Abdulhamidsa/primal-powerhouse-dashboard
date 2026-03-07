'use client';

import { useMemo, useState } from 'react';
import { createFoodSchema } from '@/features/foods/schemas/food.schema';
import { useCreateFood } from '@/features/foods/hooks/useFoods';

type FoodFormProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  onCreatedAction?: () => void;
};

const categoryOptions = ['protein', 'carb', 'fat', 'dairy', 'fruit', 'vegetable', 'extra'] as const;
const stateOptions = ['raw', 'dry', 'as_sold', 'cooked'] as const;
const sourceOptions = ['custom', 'system'] as const;

export default function FoodForm({ isOpen, onCloseAction, onCreatedAction }: FoodFormProps) {
  const { submit } = useCreateFood();
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'protein' as (typeof categoryOptions)[number],
    state: 'raw' as (typeof stateOptions)[number],
    caloriesKcal: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    fiberG: '',
    baseUnit: '100g' as '100g' | 'unit',
    gramsPerUnit: '',
    displayUnitLabel: '',
    sourceRef: '',
    source: 'custom' as (typeof sourceOptions)[number],
    isActive: true,
    verifiedBy: '',
    verifiedAt: '',
  });

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
    setFormData({
      name: '',
      category: 'protein',
      state: 'raw',
      caloriesKcal: '',
      proteinG: '',
      carbsG: '',
      fatG: '',
      fiberG: '',
      baseUnit: '100g',
      gramsPerUnit: '',
      displayUnitLabel: '',
      sourceRef: '',
      source: 'custom',
      isActive: true,
      verifiedBy: '',
      verifiedAt: '',
    });
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
      await submit(parsedPreview.data);
      onCreatedAction?.();
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create ingredient');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-700 p-5">
          <h3 className="text-xl font-semibold text-zinc-100">Add Ingredient</h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="p-5 space-y-5">
          {formError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-2">Name</label>
              <input
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
                placeholder="e.g., Chicken breast"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={e =>
                  setFormData(prev => ({ ...prev, category: e.target.value as (typeof categoryOptions)[number] }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
              >
                {categoryOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">kcal</label>
              <input
                type="number"
                value={formData.caloriesKcal}
                onChange={e => setFormData(prev => ({ ...prev, caloriesKcal: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Protein</label>
              <input
                type="number"
                value={formData.proteinG}
                onChange={e => setFormData(prev => ({ ...prev, proteinG: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Carbs</label>
              <input
                type="number"
                value={formData.carbsG}
                onChange={e => setFormData(prev => ({ ...prev, carbsG: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Fat</label>
              <input
                type="number"
                value={formData.fatG}
                onChange={e => setFormData(prev => ({ ...prev, fatG: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Fiber</label>
              <input
                type="number"
                value={formData.fiberG}
                onChange={e => setFormData(prev => ({ ...prev, fiberG: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">State</label>
              <select
                value={formData.state}
                onChange={e =>
                  setFormData(prev => ({ ...prev, state: e.target.value as (typeof stateOptions)[number] }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
              >
                {stateOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Base Unit</label>
              <select
                value={formData.baseUnit}
                onChange={e => setFormData(prev => ({ ...prev, baseUnit: e.target.value as '100g' | 'unit' }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
              >
                <option value="100g">100g</option>
                <option value="unit">unit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Source Ref (optional)</label>
              <input
                value={formData.sourceRef}
                onChange={e => setFormData(prev => ({ ...prev, sourceRef: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Source</label>
              <select
                value={formData.source}
                onChange={e => setFormData(prev => ({ ...prev, source: e.target.value as (typeof sourceOptions)[number] }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
              >
                {sourceOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Verified By (optional)</label>
              <input
                value={formData.verifiedBy}
                onChange={e => setFormData(prev => ({ ...prev, verifiedBy: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Verified At (optional)</label>
              <input
                type="datetime-local"
                value={formData.verifiedAt}
                onChange={e => setFormData(prev => ({ ...prev, verifiedAt: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                Active
              </label>
            </div>
          </div>

          {formData.baseUnit === 'unit' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">Grams Per Unit</label>
                <input
                  type="number"
                  value={formData.gramsPerUnit}
                  onChange={e => setFormData(prev => ({ ...prev, gramsPerUnit: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">Unit Label</label>
                <input
                  value={formData.displayUnitLabel}
                  onChange={e => setFormData(prev => ({ ...prev, displayUnitLabel: e.target.value }))}
                  placeholder="e.g., egg, scoop, tortilla"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-700 p-5">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Ingredient'}
          </button>
        </div>
      </div>
    </div>
  );
}
