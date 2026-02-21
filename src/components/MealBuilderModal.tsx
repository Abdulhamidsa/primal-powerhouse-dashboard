'use client';

import { useState, useMemo } from 'react';
import { useMealBuilder } from '@/hooks/useMealBuilder';
import { DataService } from '@/services/dataService';
import IngredientSearch from './IngredientSearch';
import SelectedIngredientRow from './SelectedIngredientRow';
import TotalsPanel from './TotalsPanel';
import type { SelectedIngredient } from '@/types/openFoodFacts';

interface MealBuilderModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onMealCreatedAction: () => void;
}

export default function MealBuilderModal({ isOpen, onCloseAction, onMealCreatedAction }: MealBuilderModalProps) {
  const {
    state,
    updateMealMeta,
    addIngredient,
    removeIngredient,
    updateIngredientGrams,
    calculateTotals,
    calculatePerServingNutrition,
    resetForm,
  } = useMealBuilder();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string>('');

  const selectedIds = useMemo(() => new Set(state.selectedIngredients.map(ing => ing.id)), [state.selectedIngredients]);

  const totals = calculateTotals();
  const perServing = calculatePerServingNutrition();

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!state.name.trim()) {
      newErrors.name = 'Meal name is required';
    }
    if (state.selectedIngredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
    }
    if (state.servings < 1) {
      newErrors.servings = 'Servings must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    console.log('Submitting meal with state:', state, 'totals:', totals);

    if (!validateForm()) {
      setUploadError('Please fix the highlighted fields before creating the meal.');
      return;
    }

    try {
      setLoading(true);
      setUploadError('');

      // Build ingredients string from selected ingredients
      const ingredientsStr = state.selectedIngredients
        .map(ing => `${ing.name} (${ing.grams}g)${ing.brand ? ` - ${ing.brand}` : ''}`)
        .join(', ');

      // Create meal using existing service (same as manual form)
      const mealData = {
        name: state.name,
        type: state.type,
        calories: totals.kcal,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        fiber: totals.fiber || 0,
        ingredients: state.selectedIngredients.map(ing => ing.name),
        instructions: [
          `Built from ingredients using Meal Builder. Total of ${state.selectedIngredients.length} ingredient(s).`,
          `Detailed ingredients: ${ingredientsStr}`,
        ],
        prepTime: 0,
        cookTime: 0,
        servings: state.servings,
        tags: ['built-from-ingredients', ...state.tags].filter(Boolean),
        imageUrl: state.imageUrl || undefined,
      };

      console.log('Creating meal from builder:', mealData);
      await DataService.createMeal(mealData);

      onMealCreatedAction();
      onCloseAction();
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create meal';
      setUploadError(message);
      console.error('Error creating meal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    removeIngredient(ingredientId);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-2 sm:p-6">
      <div className="w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950/80 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100">Build Meal</h2>
            <p className="text-xs sm:text-sm text-zinc-400">Create a meal from USDA ingredients</p>
          </div>
          <button
            type="button"
            onClick={onCloseAction}
            aria-label="Close"
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-300 hover:text-zinc-100"
          >
            <span className="text-lg">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 space-y-6">
            {/* Error Messages */}
            {uploadError && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {uploadError}
              </div>
            )}

            {/* Meal Meta Info */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-zinc-100 mb-4">Meal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Meal Name *</label>
                  <input
                    type="text"
                    value={state.name}
                    onChange={e => updateMealMeta({ name: e.target.value })}
                    className={`w-full rounded-lg border bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-zinc-800'
                    }`}
                    placeholder="e.g., Grilled Chicken Salad"
                  />
                  {errors.name && <p className="text-xs text-red-400 mt-2">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Meal Type *</label>
                  <select
                    value={state.type}
                    onChange={e =>
                      updateMealMeta({
                        type: e.target.value as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
                      })
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                    <option value="SNACK">Snack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Servings</label>
                  <input
                    type="number"
                    value={state.servings}
                    onChange={e => updateMealMeta({ servings: Math.max(1, Number(e.target.value)) })}
                    min="1"
                    max="10"
                    className={`w-full rounded-lg border bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.servings ? 'border-red-500' : 'border-zinc-800'
                    }`}
                  />
                  {errors.servings && <p className="text-xs text-red-400 mt-2">{errors.servings}</p>}
                </div>
              </div>
            </div>

            {/* Ingredient Search */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-zinc-100 mb-4">Add Ingredients</h3>
              <IngredientSearch
                onAddIngredientAction={(ingredient: SelectedIngredient) => addIngredient(ingredient)}
                selectedIds={selectedIds}
              />
            </div>

            {/* Selected Ingredients */}
            {state.selectedIngredients.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-zinc-100 mb-4">
                  Selected Ingredients ({state.selectedIngredients.length})
                </h3>
                <div className="space-y-3">
                  {state.selectedIngredients.map(ingredient => (
                    <SelectedIngredientRow
                      key={ingredient.id}
                      ingredient={ingredient}
                      onUpdateGramsAction={grams => updateIngredientGrams(ingredient.id, grams)}
                      onRemoveAction={() => handleRemoveIngredient(ingredient.id)}
                    />
                  ))}
                </div>
                {errors.ingredients && <p className="text-xs text-red-400 mt-2">{errors.ingredients}</p>}
              </div>
            )}

            {/* Totals Panel */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
              <TotalsPanel
                totals={totals}
                perServing={perServing}
                servings={state.servings}
                selectedIngredientsCount={state.selectedIngredients.length}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-zinc-800 bg-zinc-950/80 px-4 py-4 sm:px-6">
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={onCloseAction}
                className="w-full sm:flex-1 rounded-lg border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || state.selectedIngredients.length === 0}
                className="w-full sm:flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Meal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
