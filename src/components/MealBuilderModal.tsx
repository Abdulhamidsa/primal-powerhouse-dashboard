'use client';

import { useEffect, useState, useMemo } from 'react';
import { Copy, Sparkles } from 'lucide-react';
import { useMealBuilder } from '@/hooks/useMealBuilder';
import { useMealPromptGenerator } from '@/features/meals/hooks/useMealPromptGenerator';
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

  const {
    promptText,
    error: promptError,
    copied,
    hasPrompt,
    generate,
    copy,
    reset: resetPromptState,
  } = useMealPromptGenerator();

  const selectedIds = useMemo(() => new Set(state.selectedIngredients.map(ing => ing.id)), [state.selectedIngredients]);

  const totals = calculateTotals();
  const perServing = calculatePerServingNutrition();

  const parseInstructionSteps = (items: string[]): string[] => {
    return items
      .flatMap(item => item.split(/[\n,]+/g))
      .map(step => step.replace(/^\s*\d+[\).:\-]?\s*/, '').trim())
      .filter(Boolean);
  };

  useEffect(() => {
    if (!isOpen) {
      resetPromptState();
    }
  }, [isOpen, resetPromptState]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const parsedInstructions = parseInstructionSteps(instructions);

    if (!state.name.trim()) {
      newErrors.name = 'Meal name is required';
    }
    if (state.selectedIngredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
    }
    if (state.servings < 1) {
      newErrors.servings = 'Servings must be at least 1';
    }
    if (parsedInstructions.length === 0) {
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
      const parsedInstructions = parseInstructionSteps(instructions);

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
        instructions: parsedInstructions,
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

  const splitBulkInstructions = () => {
    const parsed = parseInstructionSteps(instructions);
    setInstructions(parsed.length > 0 ? parsed : ['']);

    if (parsed.length > 0) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.instructions;
        return next;
      });
    }
  };

  const handleGeneratePrompt = () => {
    generate({
      mealName: state.name,
      ingredients: state.selectedIngredients.map(ingredient => ingredient.name),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-6">
        <div className="modal-content w-full max-w-5xl rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-foreground">Build Meal</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Create a meal template from your ingredients database.
                </p>
              </div>

              <button
                type="button"
                onClick={onCloseAction}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              {uploadError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {uploadError}
                </div>
              )}

              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4 sm:p-5">
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-[var(--color-text)]">Meal Information</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Set the core details for the template meal.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Meal Name *</label>
                    <input
                      type="text"
                      value={state.name}
                      onChange={e => updateMealMeta({ name: e.target.value })}
                      className={`input-base w-full ${errors.name ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                      placeholder="e.g., Grilled Chicken Salad"
                    />
                    {errors.name && <p className="mt-2 text-xs text-red-400">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Meal Type *</label>
                    <select
                      value={state.type}
                      onChange={e =>
                        updateMealMeta({
                          type: e.target.value as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
                        })
                      }
                      className="input-base w-full appearance-none"
                    >
                      <option value="BREAKFAST">Breakfast</option>
                      <option value="LUNCH">Lunch</option>
                      <option value="DINNER">Dinner</option>
                      <option value="SNACK">Snack</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Servings</label>
                    <input
                      type="number"
                      value={state.servings}
                      onChange={e => updateMealMeta({ servings: Math.max(1, Number(e.target.value)) })}
                      min="1"
                      max="10"
                      className={`input-base w-full ${errors.servings ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                    />
                    {errors.servings && <p className="mt-2 text-xs text-red-400">{errors.servings}</p>}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--color-text)]">Add Ingredients</h3>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Search your ingredient database and add items to the meal.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFoodFormModal(true)}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-alt)]"
                  >
                    Add Ingredient
                  </button>
                </div>

                <IngredientSearch
                  onAddIngredientAction={(ingredient: SelectedIngredient) => addIngredient(ingredient)}
                  selectedIds={selectedIds}
                />
              </section>

              {state.selectedIngredients.length > 0 && (
                <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4 sm:p-5">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-[var(--color-text)]">
                      Selected Ingredients ({state.selectedIngredients.length})
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Adjust grams or remove ingredients before creating the meal.
                    </p>
                  </div>

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

                  {errors.ingredients && <p className="mt-2 text-xs text-red-400">{errors.ingredients}</p>}
                </section>
              )}

              <section className="">
                <TotalsPanel
                  totals={totals}
                  perServing={perServing}
                  servings={state.servings}
                  selectedIngredientsCount={state.selectedIngredients.length}
                />
              </section>
              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--color-text)]">Instructions</h3>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Add steps manually or split pasted comma-separated text.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={splitBulkInstructions}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-alt)]"
                    >
                      Split Commas
                    </button>
                    <button
                      type="button"
                      onClick={addInstruction}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-alt)]"
                    >
                      Add Step
                    </button>
                  </div>
                </div>

                <p className="mb-3 text-xs text-[var(--color-text-muted)]">
                  Tip: paste bulk text in one line using commas, then click Split Commas.
                </p>

                <div className="space-y-3">
                  {instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="flex min-w-[44px] items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                        {index + 1}
                      </span>

                      <input
                        type="text"
                        value={instruction}
                        onChange={e => handleInstructionChange(index, e.target.value)}
                        className="input-base flex-1"
                        placeholder="e.g., Cook rice and grill chicken"
                      />

                      {instructions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInstruction(index)}
                          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {errors.instructions && <p className="mt-2 text-xs text-red-400">{errors.instructions}</p>}
              </section>

              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4 sm:p-5">
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-[var(--color-text)]">Meal Image</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Upload an image and generate a matching prompt.
                  </p>
                </div>

                <ImageUpload
                  onFileSelectAction={file => {
                    setSelectedImageFile(file);
                    setUploadError('');
                  }}
                  onError={setUploadError}
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={handleGeneratePrompt}
                  disabled={loading || !state.name.trim()}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles size={16} />
                  {hasPrompt ? 'Regenerate ChatGPT Prompt' : 'Generate ChatGPT Prompt'}
                </button>

                <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-[var(--color-text-muted)]">ChatGPT Image Prompt</p>
                    <button
                      type="button"
                      onClick={copy}
                      disabled={!hasPrompt}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Copy generated prompt"
                      title="Copy prompt"
                    >
                      <Copy size={14} />
                    </button>
                  </div>

                  <textarea
                    readOnly
                    value={
                      hasPrompt
                        ? promptText
                        : 'Generate prompt to see a ready-to-copy Positive Prompt + Negative Prompt for ChatGPT image generation.'
                    }
                    className="min-h-[140px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-xs text-[var(--color-text)]"
                  />

                  {copied ? <p className="mt-2 text-xs text-emerald-400">Copied</p> : null}
                  {promptError ? <p className="mt-2 text-xs text-red-400">{promptError}</p> : null}
                </div>
              </section>
            </div>

            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-4 backdrop-blur sm:px-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" onClick={onCloseAction} className="btn-secondary w-full sm:flex-1">
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || state.selectedIngredients.length === 0}
                  className="btn-primary w-full flex-1 bg-[var(--color-accent)] text-[var(--color-text-on-accent)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Template Meal'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <FoodForm isOpen={showFoodFormModal} onCloseAction={() => setShowFoodFormModal(false)} />
      </div>
    </div>
  );
}
