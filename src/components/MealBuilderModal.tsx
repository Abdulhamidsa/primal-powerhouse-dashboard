'use client';

import { useEffect, useState, useMemo } from 'react';
import { ChevronDown, Copy, Sparkles } from 'lucide-react';
import { useMealBuilder } from '@/hooks/useMealBuilder';
import { useMealPromptGenerator } from '@/features/meals/hooks/useMealPromptGenerator';
import { useGenerateMealTemplate } from '@/features/meals/hooks/useGenerateMealTemplate';
import { createSide, generateSideTemplate } from '@/features/sides/api/sides.api';
import { DataService } from '@/services/dataService';
import { httpClient } from '@/lib/http/client';
import IngredientSearch from './IngredientSearch';
import SelectedIngredientRow from './SelectedIngredientRow';
import TotalsPanel from './TotalsPanel';
import type { SelectedIngredient } from '@/types/openFoodFacts';
import type { BuilderMealType, FoodOrigin } from '@/features/meals/types/mealTemplateGeneration.types';
import type { SideType } from '@/features/sides/types/side.types';
import FoodForm from '@/features/foods/components/FoodForm';
import type { FoodFormPrefill } from '@/features/foods/components/FoodForm';
import { useCreateFoodAlias } from '@/features/foods/hooks/useFoodAliases';
import type { FoodMacroUpdatePayload, FoodRecord } from '@/features/foods/types/food.types';
import { useRematchMealIngredients } from '@/features/meals/hooks/useRematchMealIngredients';
import UnmatchedIngredientPanel from '@/features/meals/components/UnmatchedIngredientPanel';
import ImageUpload from '@/components/ImageUpload';
import type { UnmatchedIngredientInput } from '@/types/meal';

interface MealBuilderModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onMealCreatedAction: () => void;
}

type BuilderEntityType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'SIDE';

function normalizeRecoveryLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapTemplateIngredientToSelectedIngredient(ingredient: {
  id: string;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  grams: number;
  servingUnit?: 'g' | 'piece';
  gramsPerUnit?: number | null;
  displayUnitLabel?: string | null;
}): SelectedIngredient {
  return {
    id: ingredient.id,
    name: ingredient.name,
    kcalPer100g: ingredient.kcalPer100g,
    proteinPer100g: ingredient.proteinPer100g,
    carbsPer100g: ingredient.carbsPer100g,
    fatPer100g: ingredient.fatPer100g,
    fiberPer100g: ingredient.fiberPer100g,
    hasIncompleteData: false,
    grams: ingredient.grams,
    servingUnit: ingredient.servingUnit,
    gramsPerUnit: ingredient.gramsPerUnit,
    displayUnitLabel: ingredient.displayUnitLabel,
  };
}

function mapFoodRecordToSelectedIngredient(food: FoodRecord, grams: number): SelectedIngredient {
  return {
    id: food.id,
    name: food.name,
    kcalPer100g: food.caloriesKcal,
    proteinPer100g: food.proteinG,
    carbsPer100g: food.carbsG,
    fatPer100g: food.fatG,
    fiberPer100g: food.fiberG ?? 0,
    hasIncompleteData: false,
    grams,
    servingUnit: food.baseUnit === 'unit' ? 'piece' : 'g',
    gramsPerUnit: food.gramsPerUnit,
    displayUnitLabel: food.displayUnitLabel,
  };
}

export default function MealBuilderModal({ isOpen, onCloseAction, onMealCreatedAction }: MealBuilderModalProps) {
  const FOOD_ORIGIN_OPTIONS: FoodOrigin[] = [
    'Middle Eastern',
    'Mediterranean',
    'Greek',
    'Italian',
    'Mexican',
    'Asian',
    'Western',
    'Indian',
  ];

  const {
    state,
    setState,
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
  const [aiNotice, setAiNotice] = useState<string>('');
  const [showFoodFormModal, setShowFoodFormModal] = useState(false);
  const [foodFormPrefill, setFoodFormPrefill] = useState<FoodFormPrefill | null>(null);
  const [pendingIngredientRecovery, setPendingIngredientRecovery] = useState<UnmatchedIngredientInput | null>(null);
  const [isIngredientSearchOpen, setIsIngredientSearchOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [spices, setSpices] = useState<string[]>(['']);
  const [foodOrigin, setFoodOrigin] = useState<'ANY' | FoodOrigin>('ANY');
  const [sideType, setSideType] = useState<SideType>('SALAD');
  const [recentSideNames, setRecentSideNames] = useState<string[]>([]);
  const [unmatchedIngredients, setUnmatchedIngredients] = useState<UnmatchedIngredientInput[]>([]);
  const { submit: createFoodAlias } = useCreateFoodAlias();
  const { loading: rematchLoading, error: rematchError, rematch } = useRematchMealIngredients();

  const {
    promptText,
    error: promptError,
    copied,
    hasPrompt,
    generate,
    copy,
    reset: resetPromptState,
  } = useMealPromptGenerator();

  const {
    loading: aiGenerating,
    error: aiGenerationError,
    generateTemplate,
    reset: resetTemplateGenerator,
  } = useGenerateMealTemplate();

  const selectedIds = useMemo(() => new Set(state.selectedIngredients.map(ing => ing.id)), [state.selectedIngredients]);
  const isSideMode = state.type === 'SIDE';

  const totals = calculateTotals();
  const perServing = calculatePerServingNutrition();

  const parseInstructionSteps = (items: string[]): string[] => {
    return items
      .map(item => item)
      .map(step => step.replace(/^\s*\d+[\).:\-]?\s*/, '').trim())
      .filter(Boolean);
  };

  useEffect(() => {
    if (!isOpen) {
      resetPromptState();
      resetTemplateGenerator();
      setAiNotice('');
      setFoodOrigin('ANY');
      setSideType('SALAD');
      setRecentSideNames([]);
      setFoodFormPrefill(null);
      setPendingIngredientRecovery(null);
      setUnmatchedIngredients([]);
    }
  }, [isOpen, resetPromptState, resetTemplateGenerator]);

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

    if (isSideMode && totals.kcal > 80) {
      setUploadError(
        `Sides must be 80 kcal or less. Current total is ${Math.round(totals.kcal)} kcal. Reduce ingredient grams and try again.`,
      );
      return;
    }

    if (!validateForm()) {
      setUploadError('Please fix the highlighted fields before creating the meal.');
      return;
    }

    try {
      setLoading(true);
      setUploadError('');
      const parsedInstructions = parseInstructionSteps(instructions);
      const parsedSpices = spices.map(item => item.trim()).filter(Boolean);

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

        const uploadResult = await httpClient.postForm<{
          success: boolean;
          data?: { url: string };
          error?: string;
          details?: string;
        }>('/api/cloudinary/upload', uploadFormData);

        if (!uploadResult?.success || !uploadResult.data?.url) {
          throw new Error(uploadResult?.details || uploadResult?.error || 'Failed to upload image');
        }

        imageUrl = uploadResult.data.url;
      }

      if (isSideMode) {
        await createSide({
          name: state.name,
          type: sideType,
          imageUrl,
          calories: totals.kcal,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          fiber: totals.fiber || 0,
          ingredients: state.selectedIngredients.map(ingredient => ingredient.name),
          spices: parsedSpices,
          instructions: parsedInstructions,
          foodOrigin: foodOrigin === 'ANY' ? undefined : foodOrigin,
        });
      } else {
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
          spices: parsedSpices,
          prepTime: 0,
          cookTime: 0,
          servings: state.servings,
          tags: ['built-from-ingredients', ...state.tags].filter(Boolean),
          imageUrl,
        };

        console.log('Creating meal from builder:', mealData);
        await DataService.createMeal(mealData);
      }

      onMealCreatedAction();
      onCloseAction();
      resetForm();
      setIsIngredientSearchOpen(false);
      setInstructions(['']);
      setSpices(['']);
      setSideType('SALAD');
      setFoodOrigin('ANY');
      setSelectedImageFile(null);
      setFoodFormPrefill(null);
      setPendingIngredientRecovery(null);
      setUnmatchedIngredients([]);
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

  const handleSpiceChange = (index: number, value: string) => {
    setSpices(prev => prev.map((item, i) => (i === index ? value : item)));
  };

  const addSpice = () => {
    setSpices(prev => [...prev, '']);
  };

  const removeSpice = (index: number) => {
    setSpices(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleGeneratePrompt = () => {
    generate({
      mealName: state.name,
      ingredients: state.selectedIngredients.map(ingredient => ingredient.name),
      spices: spices.map(item => item.trim()).filter(Boolean),
    });
  };

  const openBlankFoodForm = () => {
    setPendingIngredientRecovery(null);
    setFoodFormPrefill(null);
    setShowFoodFormModal(true);
  };

  const openRecoveryFoodForm = (item: UnmatchedIngredientInput) => {
    setPendingIngredientRecovery(item);
    setFoodFormPrefill({
      name: item.name,
      category: 'protein',
      state: 'raw',
      source: 'custom',
      baseUnit: '100g',
      isActive: true,
    });
    setShowFoodFormModal(true);
  };

  const applyRematchResult = async (itemsToResolve: UnmatchedIngredientInput[], prefixMessage: string) => {
    try {
      const result = await rematch(itemsToResolve);
      const rematchedIngredients = result.matchedIngredients.map(mapTemplateIngredientToSelectedIngredient);
      const currentSelectedIngredients = state.selectedIngredients;
      const nextSelectedIngredients = [...currentSelectedIngredients];

      rematchedIngredients.forEach(ingredient => {
        if (!nextSelectedIngredients.some(existing => existing.id === ingredient.id)) {
          nextSelectedIngredients.push(ingredient);
        }
      });

      setState(prev => ({
        ...prev,
        selectedIngredients: nextSelectedIngredients,
      }));

      const resolvedKeys = new Set(itemsToResolve.map(item => `${item.name}::${item.grams}`));
      setUnmatchedIngredients(prev => {
        const pending = prev.filter(item => !resolvedKeys.has(`${item.name}::${item.grams}`));
        const merged = [...pending, ...result.unmatchedIngredients];
        const seen = new Set<string>();
        return merged.filter(item => {
          const key = `${item.name}::${item.grams}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });

      generate({
        mealName: state.name,
        ingredients: nextSelectedIngredients.map(ingredient => ingredient.name),
        spices: spices.map(item => item.trim()).filter(Boolean),
      });

      const noticeParts = [prefixMessage];
      if (result.matchedIngredients.length > 0) {
        noticeParts.push(`Matched ${result.matchedIngredients.length} ingredient(s) into the meal.`);
      }
      if (result.unmatchedIngredients.length > 0) {
        noticeParts.push(`Still unmatched: ${result.unmatchedIngredients.map(item => item.name).join(', ')}.`);
      }
      if (result.warnings.length > 0) {
        noticeParts.push(result.warnings.join(' | '));
      }
      setAiNotice(noticeParts.join(' '));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to rematch ingredient');
    }
  };

  const handleFoodCreated = async (createdFood?: FoodRecord) => {
    if (!createdFood || !pendingIngredientRecovery) {
      return;
    }

    const recoveryItem = pendingIngredientRecovery;
    setPendingIngredientRecovery(null);
    setFoodFormPrefill(null);

    const needsAlias = normalizeRecoveryLabel(recoveryItem.name) !== normalizeRecoveryLabel(createdFood.name);
    if (needsAlias) {
      const shouldCreateAlias = window.confirm(
        `Create alias "${recoveryItem.name}" for "${createdFood.name}" so future AI matches resolve automatically?`,
      );

      if (shouldCreateAlias) {
        try {
          await createFoodAlias({
            foodId: createdFood.id,
            alias: recoveryItem.name,
          });
        } catch (error) {
          setUploadError(error instanceof Error ? error.message : 'Failed to create alias');
          return;
        }
      }
    }

    await applyRematchResult(
      [recoveryItem],
      needsAlias
        ? `Added ${createdFood.name} and refreshed the current AI meal.`
        : `Added ${createdFood.name} to the database.`,
    );
  };

  const handleCreateAliasForUnmatched = async (input: {
    item: UnmatchedIngredientInput;
    targetFood: FoodRecord;
    alias: string;
    updateMacros?: FoodMacroUpdatePayload;
  }) => {
    const { item, targetFood, alias, updateMacros } = input;

    const confirmed = window.confirm(`Create alias "${alias}" for "${targetFood.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      const createdAlias = await createFoodAlias({
        foodId: targetFood.id,
        alias,
        updateMacros,
      });

      const notice = createdAlias.macrosUpdated
        ? `Alias saved for ${alias}. Ingredient macros updated globally for ${targetFood.name}.`
        : `Alias saved for ${alias}.`;
      await applyRematchResult([item], notice);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create alias';
      if (message.includes('Alias already exists for this ingredient')) {
        await applyRematchResult([item], `Alias already existed for ${alias}. Matched it immediately.`);
        return;
      }

      setUploadError(message);
    }
  };

  const handleUseMatchForUnmatched = async (input: { item: UnmatchedIngredientInput; targetFood: FoodRecord }) => {
    const { item, targetFood } = input;
    const matchedIngredient = mapFoodRecordToSelectedIngredient(targetFood, item.grams);

    setState(prev => {
      const existingIndex = prev.selectedIngredients.findIndex(ingredient => ingredient.id === matchedIngredient.id);
      if (existingIndex === -1) {
        return {
          ...prev,
          selectedIngredients: [...prev.selectedIngredients, matchedIngredient],
        };
      }

      const nextSelectedIngredients = [...prev.selectedIngredients];
      const current = nextSelectedIngredients[existingIndex];
      nextSelectedIngredients[existingIndex] = {
        ...current,
        grams: current.grams + item.grams,
      };

      return {
        ...prev,
        selectedIngredients: nextSelectedIngredients,
      };
    });

    setUnmatchedIngredients(prev => prev.filter(entry => !(entry.name === item.name && entry.grams === item.grams)));

    generate({
      mealName: state.name,
      ingredients: [...state.selectedIngredients.map(ingredient => ingredient.name), targetFood.name],
      spices: spices.map(entry => entry.trim()).filter(Boolean),
    });

    setAiNotice(`Matched ${item.name} directly to ${targetFood.name}.`);
  };

  const handleSuggestMealWithAi = async () => {
    const hasExistingData =
      state.name.trim().length > 0 ||
      state.selectedIngredients.length > 0 ||
      parseInstructionSteps(instructions).length > 0;

    if (hasExistingData) {
      const shouldReplace = window.confirm('Regenerate and replace current meal data?');
      if (!shouldReplace) {
        return;
      }
    }

    try {
      setUploadError('');
      setAiNotice('');

      if (isSideMode) {
        const sideTemplate = await generateSideTemplate({
          mealType: 'LUNCH',
          sideType,
          foodOrigin: foodOrigin === 'ANY' ? undefined : foodOrigin,
          avoidSideNames: recentSideNames.slice(0, 6),
        });

        const mappedSelectedIngredients = (sideTemplate.matchedIngredients ?? []).map(ingredient => ({
          id: ingredient.id,
          name: ingredient.name,
          kcalPer100g: ingredient.kcalPer100g,
          proteinPer100g: ingredient.proteinPer100g,
          carbsPer100g: ingredient.carbsPer100g,
          fatPer100g: ingredient.fatPer100g,
          fiberPer100g: ingredient.fiberPer100g,
          hasIncompleteData: false,
          grams: ingredient.grams,
          servingUnit: ingredient.servingUnit,
          gramsPerUnit: ingredient.gramsPerUnit,
          displayUnitLabel: ingredient.displayUnitLabel,
        }));

        setState(prev => ({
          ...prev,
          name: sideTemplate.name,
          servings: 1,
          selectedIngredients: mappedSelectedIngredients,
        }));
        setInstructions(sideTemplate.instructions.length > 0 ? sideTemplate.instructions : ['']);
        setSpices(sideTemplate.spices.length > 0 ? sideTemplate.spices : ['']);
        setUnmatchedIngredients([]);
        setErrors({});

        generate({
          mealName: sideTemplate.name,
          ingredients:
            mappedSelectedIngredients.length > 0
              ? mappedSelectedIngredients.map(ingredient => ingredient.name)
              : sideTemplate.ingredients,
          spices: sideTemplate.spices,
        });

        const originLabel = foodOrigin === 'ANY' ? 'Any origin' : `Origin: ${foodOrigin}`;
        const ingredientNotice =
          mappedSelectedIngredients.length > 0
            ? `${mappedSelectedIngredients.length} ingredients auto-filled from your DB`
            : 'No DB ingredient matches found; add ingredients manually';
        const warningNotice =
          sideTemplate.warnings && sideTemplate.warnings.length > 0 ? ` | ${sideTemplate.warnings.join(' ')}` : '';
        setAiNotice(`AI side ready: ${sideTemplate.type} | ${originLabel}. ${ingredientNotice}.${warningNotice}`);
        setRecentSideNames(prev => {
          const normalized = sideTemplate.name.trim();
          if (!normalized) return prev;
          const next = [normalized, ...prev.filter(name => name.toLowerCase() !== normalized.toLowerCase())];
          return next.slice(0, 10);
        });
      } else {
        const template = await generateTemplate(
          state.type as BuilderMealType,
          foodOrigin === 'ANY' ? undefined : foodOrigin,
        );

        setState(prev => ({
          ...prev,
          name: template.mealName,
          type: state.type,
          servings: Math.max(1, template.servings),
          selectedIngredients: template.ingredients.map(ingredient => ({
            ...ingredient,
            hasIncompleteData: false,
          })),
        }));

        setInstructions(template.instructions.length > 0 ? template.instructions : ['']);
        setSpices(template.spices.length > 0 ? template.spices : ['']);
        setUnmatchedIngredients(template.unmatchedIngredients ?? []);
        setErrors({});

        generate({
          mealName: template.mealName,
          ingredients: template.ingredients.map(ingredient => ingredient.name),
          spices: template.spices,
        });

        const originLabel = foodOrigin === 'ANY' ? 'Any origin' : `Origin: ${foodOrigin}`;
        const baseNotice = `AI meal ready: ${template.coreDishReference} (${template.cuisineStyle}) | ${originLabel}`;
        if (template.warnings.length > 0) {
          setAiNotice(`${baseNotice}. Notes: ${template.warnings.join(' ')}`);
        } else {
          setAiNotice(baseNotice);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate meal template';
      setUploadError(message);
    }
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
                  Create a meal or side template from your ingredients database.
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

              {aiNotice && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {aiNotice}
                </div>
              )}

              {aiGenerationError && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  {aiGenerationError}
                </div>
              )}

              {rematchError && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  {rematchError}
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
                          type: e.target.value as BuilderEntityType,
                        })
                      }
                      className="input-base w-full appearance-none"
                    >
                      <option value="BREAKFAST">Breakfast</option>
                      <option value="LUNCH">Lunch</option>
                      <option value="DINNER">Dinner</option>
                      <option value="SNACK">Snack</option>
                      <option value="SIDE">Side</option>
                    </select>
                  </div>

                  {isSideMode && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Side Category *</label>
                      <select
                        value={sideType}
                        onChange={e => setSideType(e.target.value as SideType)}
                        className="input-base w-full appearance-none"
                      >
                        <option value="SALAD">Salad</option>
                        <option value="SOUP">Soup</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Food Origin</label>
                    <select
                      value={foodOrigin}
                      onChange={e => setFoodOrigin(e.target.value as 'ANY' | FoodOrigin)}
                      className="input-base w-full appearance-none"
                    >
                      <option value="ANY">Any</option>
                      {FOOD_ORIGIN_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
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

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleSuggestMealWithAi}
                      disabled={loading || aiGenerating}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Sparkles size={16} />
                      {aiGenerating
                        ? 'Generating With AI...'
                        : isSideMode
                          ? 'Suggest Side with AI'
                          : 'Suggest Meal with AI'}
                    </button>
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                      {isSideMode
                        ? 'AI suggests side naming, spices, and instructions. Add or refine ingredients and nutrition before saving.'
                        : 'Strict mode is enabled: AI only returns meals when all ingredients match your database. If an origin is selected, generation is strict to that origin.'}
                    </p>
                  </div>
                </div>
              </section>
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
              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsIngredientSearchOpen(prev => !prev)}
                    className="flex flex-1 items-start justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-left transition-colors hover:bg-[var(--color-bg-alt)]"
                    aria-expanded={isIngredientSearchOpen}
                    aria-label="Toggle ingredients search"
                  >
                    <div>
                      <h3 className="text-base font-semibold text-[var(--color-text)]">Ingredients</h3>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Click to {isIngredientSearchOpen ? 'hide' : 'open'} ingredient search.
                      </p>
                    </div>

                    <ChevronDown
                      size={18}
                      className={`mt-1 text-[var(--color-text-muted)] transition-transform ${
                        isIngredientSearchOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={openBlankFoodForm}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-alt)]"
                  >
                    Add Ingredient
                  </button>
                </div>

                {isIngredientSearchOpen ? (
                  <IngredientSearch
                    onAddIngredientAction={(ingredient: SelectedIngredient) => {
                      addIngredient(ingredient);
                      setIsIngredientSearchOpen(false);
                    }}
                    selectedIds={selectedIds}
                  />
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Search stays collapsed until you need it, so the modal remains clean and easier to scan.
                  </p>
                )}
              </section>

              {!isSideMode && unmatchedIngredients.length > 0 ? (
                <UnmatchedIngredientPanel
                  items={unmatchedIngredients}
                  busy={rematchLoading || loading}
                  onAddIngredientAction={openRecoveryFoodForm}
                  onUseMatchAction={handleUseMatchForUnmatched}
                  onCreateAliasAction={handleCreateAliasForUnmatched}
                />
              ) : null}

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
                    <h3 className="text-base font-semibold text-[var(--color-text)]">Spices and Seasonings</h3>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Add flavor boosters separately from core database ingredients.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addSpice}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-alt)]"
                  >
                    Add Spice
                  </button>
                </div>

                <div className="space-y-3">
                  {spices.map((spice, index) => (
                    <div key={`spice-${index}`} className="flex items-start gap-2">
                      <input
                        type="text"
                        value={spice}
                        onChange={e => handleSpiceChange(index, e.target.value)}
                        className="input-base flex-1"
                        placeholder="e.g., smoked paprika"
                      />

                      {spices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSpice(index)}
                          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--color-text)]">Instructions</h3>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Add clear, simple cooking steps manually.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
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
                  Tip: use one instruction per row for clean, simple steps.
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
                  {loading ? 'Creating...' : isSideMode ? 'Create Template Side' : 'Create Template Meal'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <FoodForm
          isOpen={showFoodFormModal}
          onCloseAction={() => {
            setShowFoodFormModal(false);
            setFoodFormPrefill(null);
            setPendingIngredientRecovery(null);
          }}
          onCreatedAction={handleFoodCreated}
          prefill={foodFormPrefill}
        />
      </div>
    </div>
  );
}
