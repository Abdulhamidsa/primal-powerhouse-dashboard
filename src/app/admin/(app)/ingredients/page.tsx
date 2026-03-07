'use client';

import { useMemo, useState } from 'react';
import FoodForm from '@/features/foods/components/FoodForm';
import { useFoods, useUpdateFood } from '@/features/foods/hooks/useFoods';
import { useIngredientMacroRefresh } from '@/features/ingredient-macro-refresh/hooks/useIngredientMacroRefresh';
import type { FoodCategory, FoodRecord, UpdateFoodPayload } from '@/features/foods/types/food.types';

const categoryOptions: Array<FoodCategory | 'all'> = [
  'all',
  'protein',
  'carb',
  'fat',
  'dairy',
  'fruit',
  'vegetable',
  'extra',
];

export default function IngredientsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FoodCategory | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodRecord | null>(null);
  const [editError, setEditError] = useState('');
  const [isUpdatingIngredient, setIsUpdatingIngredient] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    foodId: string;
    payload: UpdateFoodPayload;
    affectedMealsCount: number;
  } | null>(null);
  const [macroForm, setMacroForm] = useState({
    caloriesKcal: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    fiberG: '',
  });

  const { submit: updateFood } = useUpdateFood();
  const { isPreviewing, isStarting, status, error: refreshError, preview, start, reset } = useIngredientMacroRefresh();

  const params = useMemo(
    () => ({
      q: query.trim() || undefined,
      category: category === 'all' ? undefined : category,
      isActive: true,
      limit: 100,
    }),
    [query, category]
  );

  const { items, total, isLoading, error, refresh } = useFoods(params);

  const openEditModal = (item: FoodRecord) => {
    setEditError('');
    setEditingFood(item);
    setMacroForm({
      caloriesKcal: String(item.caloriesKcal),
      proteinG: String(item.proteinG),
      carbsG: String(item.carbsG),
      fatG: String(item.fatG),
      fiberG: item.fiberG == null ? '' : String(item.fiberG),
    });
  };

  const closeEditModal = () => {
    setEditingFood(null);
    setEditError('');
  };

  const handleSaveMacroUpdate = async () => {
    if (!editingFood) return;

    const payload: UpdateFoodPayload = {
      caloriesKcal: Number(macroForm.caloriesKcal),
      proteinG: Number(macroForm.proteinG),
      carbsG: Number(macroForm.carbsG),
      fatG: Number(macroForm.fatG),
      fiberG: macroForm.fiberG.trim() ? Number(macroForm.fiberG) : null,
    };

    const hasInvalid =
      Number.isNaN(payload.caloriesKcal) ||
      Number.isNaN(payload.proteinG) ||
      Number.isNaN(payload.carbsG) ||
      Number.isNaN(payload.fatG) ||
      (payload.fiberG != null && Number.isNaN(payload.fiberG));

    if (hasInvalid) {
      setEditError('Please enter valid numeric macro values.');
      return;
    }

    try {
      setEditError('');
      const affectedMealsCount = await preview(editingFood.id, 'all');
      setPendingConfirmation({
        foodId: editingFood.id,
        payload,
        affectedMealsCount,
      });
    } catch (previewError) {
      setEditError(previewError instanceof Error ? previewError.message : 'Failed to preview impacted meals');
    }
  };

  const confirmGlobalRefresh = async () => {
    if (!pendingConfirmation) return;

    try {
      setIsUpdatingIngredient(true);
      setEditError('');

      await updateFood(pendingConfirmation.foodId, pendingConfirmation.payload);
      await start(pendingConfirmation.foodId, 'all');

      setPendingConfirmation(null);
      setEditingFood(null);
      await refresh();
    } catch (updateError) {
      setEditError(updateError instanceof Error ? updateError.message : 'Failed to update ingredient macros');
    } finally {
      setIsUpdatingIngredient(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Ingredients</h1>
          <p className="text-sm text-zinc-400">
            Add and manage your internal ingredient catalog used by meal building.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Add Ingredient
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-xs font-medium text-zinc-400">Search</label>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or unit label"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as FoodCategory | 'all')}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
          >
            {categoryOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <p className="text-sm text-zinc-300">
            {isLoading ? 'Loading ingredients...' : `${total} ingredient${total === 1 ? '' : 's'}`}
          </p>
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="p-4 text-sm text-red-300">Failed to load ingredients: {error.message}</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-zinc-400">No ingredients found for current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-800/80 text-zinc-300">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">State</th>
                  <th className="px-4 py-2 text-left">Unit</th>
                  <th className="px-4 py-2 text-left">kcal</th>
                  <th className="px-4 py-2 text-left">Protein</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-t border-zinc-800 text-zinc-200">
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2">{item.category}</td>
                    <td className="px-4 py-2">{item.state}</td>
                    <td className="px-4 py-2">
                      {item.baseUnit}
                      {item.baseUnit === 'unit' && item.gramsPerUnit
                        ? ` (${item.gramsPerUnit}g ${item.displayUnitLabel || 'unit'})`
                        : ''}
                    </td>
                    <td className="px-4 py-2">{item.caloriesKcal}</td>
                    <td className="px-4 py-2">{item.proteinG}g</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
                      >
                        Edit Macros
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {status ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
          <p className="text-sm font-semibold text-zinc-100">Global Ingredient Refresh Status</p>
          <p className="text-xs text-zinc-300">
            Status: <span className="font-semibold">{status.status}</span>
          </p>
          <p className="text-xs text-zinc-300">
            Updated meals: {status.processedMealsCount} / {status.affectedMealsCount}
          </p>
          <p className="text-xs text-zinc-300">Failed meals: {status.failedMealsCount}</p>
          {status.error ? <p className="text-xs text-red-300">{status.error}</p> : null}
          {refreshError ? <p className="text-xs text-red-300">{refreshError}</p> : null}
          {status.failedMealErrors.length > 0 ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-2 max-h-32 overflow-y-auto">
              {status.failedMealErrors.map(entry => (
                <p key={`${entry.mealId}-${entry.reason}`} className="text-[11px] text-zinc-400">
                  {entry.mealId}: {entry.reason}
                </p>
              ))}
            </div>
          ) : null}
          {(status.status === 'READY' || status.status === 'FAILED') && (
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
            >
              Dismiss Status
            </button>
          )}
        </div>
      ) : null}

      <FoodForm isOpen={showForm} onCloseAction={() => setShowForm(false)} onCreatedAction={refresh} />

      {editingFood && (
        <div className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-700 p-5">
              <h3 className="text-xl font-semibold text-zinc-100">Edit Ingredient Macros</h3>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-zinc-300">
                Ingredient: <span className="font-semibold text-zinc-100">{editingFood.name}</span>
              </p>

              {editError ? (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{editError}</div>
              ) : null}

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-2">kcal</label>
                  <input
                    type="number"
                    value={macroForm.caloriesKcal}
                    onChange={e => setMacroForm(prev => ({ ...prev, caloriesKcal: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-2">Protein</label>
                  <input
                    type="number"
                    value={macroForm.proteinG}
                    onChange={e => setMacroForm(prev => ({ ...prev, proteinG: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-2">Carbs</label>
                  <input
                    type="number"
                    value={macroForm.carbsG}
                    onChange={e => setMacroForm(prev => ({ ...prev, carbsG: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-2">Fat</label>
                  <input
                    type="number"
                    value={macroForm.fatG}
                    onChange={e => setMacroForm(prev => ({ ...prev, fatG: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-2">Fiber</label>
                  <input
                    type="number"
                    value={macroForm.fiberG}
                    onChange={e => setMacroForm(prev => ({ ...prev, fiberG: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-700 p-5">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMacroUpdate}
                disabled={isPreviewing || isStarting || isUpdatingIngredient}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPreviewing ? 'Checking affected meals...' : 'Save + Refresh All Meals'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingConfirmation && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-100">Confirm Global Refresh</h3>
            <p className="text-sm text-zinc-300">
              This will update <span className="font-semibold">{pendingConfirmation.affectedMealsCount}</span> meals that
              use this ingredient.
            </p>
            <p className="text-xs text-zinc-400">
              Partial success mode is enabled: successful meal updates are saved even if some meals fail.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingConfirmation(null)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmGlobalRefresh}
                disabled={isStarting || isUpdatingIngredient}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isStarting || isUpdatingIngredient ? 'Starting...' : 'Confirm and Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
