import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import type { ApiError } from '@/lib/request';
import {
  getUserMealOptions,
  getUserMealSelection,
  saveUserMealSelection,
  USER_MEAL_OPTIONS_URL,
  USER_MEAL_SELECTION_URL,
} from '@/features/meals/api/mealSelection.api';
import type { MealMacroTotals, MealOption, MealTypeKey, SelectionItem } from '@/features/meals/types/mealSelection.types';

const REQUIRED_TYPES: MealTypeKey[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

function emptyTotals(): MealMacroTotals {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function totalsFromItems(items: SelectionItem[]): MealMacroTotals {
  return items.reduce(
    (acc, item) => ({
      calories: Math.round(acc.calories + item.meal.calories * item.portion),
      protein: Math.round(acc.protein + item.meal.protein * item.portion),
      carbs: Math.round(acc.carbs + item.meal.carbs * item.portion),
      fat: Math.round(acc.fat + item.meal.fat * item.portion),
    }),
    emptyTotals()
  );
}

export function useMealSelectionPlanner() {
  const optionsSWR = useSWR(USER_MEAL_OPTIONS_URL, getUserMealOptions);
  const selectionSWR = useSWR(USER_MEAL_SELECTION_URL, getUserMealSelection);

  const [draftItems, setDraftItems] = useState<SelectionItem[]>([]);
  const [hasTouchedDraft, setHasTouchedDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);

  const snackMax = optionsSWR.data?.constraints?.snackMax ?? 2;

  useEffect(() => {
    if (hasTouchedDraft) return;
    if (!selectionSWR.data?.selection?.items) return;
    setDraftItems(selectionSWR.data.selection.items);
  }, [selectionSWR.data, hasTouchedDraft]);

  const optionsByType = optionsSWR.data?.optionsByType;

  const baselineTotals = selectionSWR.data?.baseline.totals ?? optionsSWR.data?.baselineTotals ?? emptyTotals();
  const selectedTotals = useMemo(() => totalsFromItems(draftItems), [draftItems]);

  const delta = useMemo(
    () => ({
      calories: selectedTotals.calories - baselineTotals.calories,
      protein: selectedTotals.protein - baselineTotals.protein,
      carbs: selectedTotals.carbs - baselineTotals.carbs,
      fat: selectedTotals.fat - baselineTotals.fat,
    }),
    [selectedTotals, baselineTotals]
  );

  const selectedByType = useMemo(() => {
    return draftItems.reduce<Record<MealTypeKey, SelectionItem[]>>(
      (acc, item) => {
        acc[item.mealType].push(item);
        return acc;
      },
      { BREAKFAST: [], LUNCH: [], DINNER: [], SNACK: [] }
    );
  }, [draftItems]);

  const hasRequiredSlots = REQUIRED_TYPES.every(type => selectedByType[type].length === 1);
  const snackCount = selectedByType.SNACK.length;
  const isSnackFull = snackCount >= snackMax;

  const hasChanges = useMemo(() => {
    const source = selectionSWR.data?.selection?.items ?? [];
    if (source.length !== draftItems.length) return true;

    const sourceKey = source
      .map(item => `${item.mealType}:${item.slotIndex}:${item.mealId}`)
      .sort()
      .join('|');
    const draftKey = draftItems
      .map(item => `${item.mealType}:${item.slotIndex}:${item.mealId}`)
      .sort()
      .join('|');

    return sourceKey !== draftKey;
  }, [selectionSWR.data?.selection?.items, draftItems]);

  function selectOption(option: MealOption) {
    setHasTouchedDraft(true);
    setSaveError(null);

    setDraftItems(previous => {
      const current = [...previous];

      if (option.mealType === 'SNACK') {
        const existingSnackIndex = current.findIndex(
          item => item.mealType === 'SNACK' && item.mealId === option.meal.id
        );

        if (existingSnackIndex >= 0) {
          current.splice(existingSnackIndex, 1);
          const normalizedSnacks = current
            .filter(item => item.mealType === 'SNACK')
            .sort((a, b) => a.slotIndex - b.slotIndex)
            .map((item, index) => ({ ...item, slotIndex: index }));

          const nonSnacks = current.filter(item => item.mealType !== 'SNACK');
          return [...nonSnacks, ...normalizedSnacks];
        }

        const snackItems = current.filter(item => item.mealType === 'SNACK');
        if (snackItems.length >= snackMax) {
          return current;
        }

        const usedSlots = new Set(snackItems.map(item => item.slotIndex));
        const slotIndex = usedSlots.has(0) ? 1 : 0;

        return [
          ...current,
          {
            mealType: 'SNACK',
            slotIndex,
            mealId: option.meal.id,
            sourceAssignmentId: option.sourceAssignmentId,
            portion: option.portion,
            meal: option.meal,
          },
        ];
      }

      const withoutType = current.filter(item => item.mealType !== option.mealType);
      return [
        ...withoutType,
        {
          mealType: option.mealType,
          slotIndex: 0,
          mealId: option.meal.id,
          sourceAssignmentId: option.sourceAssignmentId,
          portion: option.portion,
          meal: option.meal,
        },
      ];
    });
  }

  function resetDraftToSaved() {
    setDraftItems(selectionSWR.data?.selection?.items ?? []);
    setHasTouchedDraft(false);
    setSaveError(null);
  }

  async function saveDraft() {
    if (snackCount > snackMax) {
      setSaveError({ message: 'You can select up to two snacks', status: 400 });
      return false;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await saveUserMealSelection({
        name: 'Current',
        items: draftItems.map(item => ({
          mealType: item.mealType,
          slotIndex: item.slotIndex,
          mealId: item.mealId,
          sourceAssignmentId: item.sourceAssignmentId ?? null,
        })),
      });

      await Promise.all([optionsSWR.mutate(), selectionSWR.mutate()]);
      setHasTouchedDraft(false);
      return true;
    } catch (error) {
      setSaveError(error as ApiError);
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  function isSelected(mealType: MealTypeKey, mealId: string): boolean {
    return draftItems.some(item => item.mealType === mealType && item.mealId === mealId);
  }

  const loading = optionsSWR.isLoading || selectionSWR.isLoading;
  const error = (optionsSWR.error || selectionSWR.error) as ApiError | undefined;

  return {
    loading,
    error,
    saveError,
    optionsByType,
    draftItems,
    selectedByType,
    selectedTotals,
    baselineTotals,
    delta,
    snackCount,
    snackMax,
    isSnackFull,
    hasRequiredSlots,
    hasChanges,
    isSaving,
    selectOption,
    isSelected,
    saveDraft,
    resetDraftToSaved,
  };
}
