'use client';

import { useState, useMemo } from 'react';
import { useMealBuilder } from '@/hooks/useMealBuilder';
import { DataService } from '@/services/dataService';
import IngredientSearch from './IngredientSearch';
import SelectedIngredientRow from './SelectedIngredientRow';
import TotalsPanel from './TotalsPanel';
import type { SelectedIngredient } from '@/types/openFoodFacts';
import FoodForm from '@/features/foods/components/FoodForm';
import ImageUpload from '@/components/ImageUpload';

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
  const [showFoodFormModal, setShowFoodFormModal] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState<string[]>(['']);

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
    if (instructions.filter(instruction => instruction.trim()).length === 0) {
      newErrors.instructions = 'At least one instruction is required';
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

      const templateIngredients = state.selectedIngredients.map(ing => {
        const unit = ing.servingUnit ?? 'g';
        const gramsPerUnit = ing.gramsPerUnit ?? null;
        const quantityAmount =
          unit === 'piece' && gramsPerUnit && gramsPerUnit > 0
            ? Math.round((ing.grams / gramsPerUnit) * 100) / 100
            : ing.grams;

        return {
          foodId: ing.id,
          name: ing.name,
          amount: quantityAmount,
          grams: ing.grams,
          unit,
          gramsPerUnit,
          displayUnitLabel: ing.displayUnitLabel ?? null,
          nutritionPer100g: {
            caloriesKcal: ing.kcalPer100g ?? 0,
            proteinG: ing.proteinPer100g ?? 0,
            carbsG: ing.carbsPer100g ?? 0,
            fatG: ing.fatPer100g ?? 0,
            fiberG: ing.fiberPer100g ?? 0,
          },
        };
      });

      let imageUrl: string | undefined;
      if (selectedImageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedImageFile);
        uploadFormData.append('folder', 'meals');

        const uploadResponse = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.details || error.error || 'Failed to upload image');
        }

        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.data.url;
      }

      // Create meal using existing service (same as manual form)
      const mealData = {
        name: state.name,
        type: state.type,
        calories: totals.kcal,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        fiber: totals.fiber || 0,
        ingredients: templateIngredients,
        instructions: instructions.filter(instruction => instruction.trim()),
        prepTime: 0,
        cookTime: 0,
        servings: state.servings,
        tags: ['built-from-ingredients', ...state.tags].filter(Boolean),
        imageUrl,
      };

      console.log('Creating meal from builder:', mealData);
      await DataService.createMeal(mealData);

      onMealCreatedAction();
      onCloseAction();
      resetForm();
      setInstructions(['']);
      setSelectedImageFile(null);
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

  const handleInstructionChange = (index: number, value: string) => {
    setInstructions(prev => prev.map((item, i) => (i === index ? value : item)));
  };

  const addInstruction = () => {
    setInstructions(prev => [...prev, '']);
  };

  const removeInstruction = (index: number) => {
    setInstructions(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black backdrop-blur-sm p-2 sm:p-6">
      <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950/80 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100">Build Meal</h2>
            <p className="text-xs sm:text-sm text-zinc-400">Create a meal template from your ingredients database</p>
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
                  <label className="block text-xs font-medium text-white mb-2">Meal Name *</label>
                  <input
                    type="text"
                    value={state.name}
                    onChange={e => updateMealMeta({ name: e.target.value })}
                    className={`w-full rounded-lg border bg-zinc-950 px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-zinc-800'
                    }`}
                    placeholder="e.g., Grilled Chicken Salad"
                  />
                  {errors.name && <p className="text-xs text-red-400 mt-2">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-white mb-2">Meal Type *</label>
                  <select
                    value={state.type}
                    onChange={e =>
                      updateMealMeta({
                        type: e.target.value as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
                      })
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                    <option value="SNACK">Snack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white mb-2">Servings</label>
                  <input
                    type="number"
                    value={state.servings}
                    onChange={e => updateMealMeta({ servings: Math.max(1, Number(e.target.value)) })}
                    min="1"
                    max="10"
                    className={`w-full rounded-lg border bg-zinc-950 px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.servings ? 'border-red-500' : 'border-zinc-800'
                    }`}
                  />
                  {errors.servings && <p className="text-xs text-red-400 mt-2">{errors.servings}</p>}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-zinc-100 mb-4">Meal Image</h3>
              <ImageUpload
                onFileSelectAction={file => {
                  setSelectedImageFile(file);
                  setUploadError('');
                }}
                onError={setUploadError}
                disabled={loading}
              />
            </div>

            {/* Ingredient Search */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-zinc-100">Add Ingredients</h3>
                <button
                  type="button"
                  onClick={() => setShowFoodFormModal(true)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-700"
                >
                  + Add Ingredient
                </button>
              </div>
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

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-zinc-100">Instructions</h3>
                <button
                  type="button"
                  onClick={addInstruction}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-700"
                >
                  + Add Step
                </button>
              </div>

              <div className="space-y-2">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="px-3 py-2 bg-zinc-800 rounded-lg text-xs font-medium text-zinc-300 min-w-[40px] text-center">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={instruction}
                      onChange={e => handleInstructionChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-zinc-700 bg-zinc-950 text-zinc-100 rounded-lg"
                      placeholder="e.g., Cook rice and grill chicken"
                    />
                    {instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInstruction(index)}
                        className="px-3 py-2 text-red-400 hover:bg-zinc-800 rounded-lg"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.instructions && <p className="text-xs text-red-400 mt-2">{errors.instructions}</p>}
            </div>

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
                {loading ? 'Creating...' : 'Create Template Meal'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <FoodForm isOpen={showFoodFormModal} onCloseAction={() => setShowFoodFormModal(false)} />
    </div>
  );
}
