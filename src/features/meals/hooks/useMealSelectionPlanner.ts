import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/request';
import { saveUserMealSelection, USER_MEAL_OPTIONS_URL, USER_MEAL_SELECTION_URL } from '@/features/meals/api/mealSelection.api';
import { getUserMealPlanSummary, USER_MEAL_PLAN_SUMMARY_URL } from '@/features/meals/api/mealPlan.api';
import type {
  MealMacroTotals,
  MealOption,
  MealTypeKey,
  SelectionItem,
  SideProgramOption,
} from '@/features/meals/types/mealSelection.types';
import type { MealPlanSummaryResponse } from '@/features/meals/types/mealPlanSummary.types';

const REQUIRED_TYPES: MealTypeKey[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

function emptyTotals(): MealMacroTotals {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function totalsFromItems(items: SelectionItem[]): MealMacroTotals {
  return items.reduce(
    (acc, item) => ({
      calories: Math.round(acc.calories + item.meal.calories * item.portion + (item.side?.calories ?? 0)),
      protein: Math.round(acc.protein + item.meal.protein * item.portion + (item.side?.protein ?? 0)),
      carbs: Math.round(acc.carbs + item.meal.carbs * item.portion + (item.side?.carbs ?? 0)),
      fat: Math.round(acc.fat + item.meal.fat * item.portion + (item.side?.fat ?? 0)),
    }),
    emptyTotals(),
  );
}

export function useMealSelectionPlanner(enabled = true) {
  const { mutate: globalMutate } = useSWRConfig();
  const summarySWR = useSWR(enabled ? USER_MEAL_PLAN_SUMMARY_URL : null, getUserMealPlanSummary, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const [draftItems, setDraftItems] = useState<SelectionItem[]>([]);
  const [hasTouchedDraft, setHasTouchedDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);

  const summary = summarySWR.data;
  const snackMax = summary?.constraints?.snackMax ?? 2;

  const sideOptions = useMemo<SideProgramOption[]>(() => {
    if (!summary?.optionsByType) return [];

    return [...summary.optionsByType.LUNCH, ...summary.optionsByType.DINNER]
      .filter(option => (option.mealType === 'LUNCH' || option.mealType === 'DINNER') && Boolean(option.side))
      .map(option => ({
        sourceAssignmentId: option.sourceAssignmentId,
        sourceMealType: option.mealType as 'LUNCH' | 'DINNER',
        meal: option.meal,
        portion: option.portion,
        scheduledTime: option.scheduledTime,
        side: option.side as NonNullable<MealOption['side']>,
      })) as SideProgramOption[];
  }, [summary?.optionsByType]);

  useEffect(() => {
    if (hasTouchedDraft) return;
    if (!summary?.selection?.items) return;
    setDraftItems(summary.selection.items);
  }, [summary?.selection?.items, hasTouchedDraft]);

  useEffect(() => {
    if (!summary) return;

    globalMutate(
      USER_MEAL_OPTIONS_URL,
      {
        optionsByType: summary.optionsByType,
        baselineSelection: summary.baselineSelection,
        baselineTotals: summary.baselineTotals,
        coachTargets: summary.coachTargets,
        constraints: summary.constraints,
      },
      false,
    );

    globalMutate(
      USER_MEAL_SELECTION_URL,
      {
        selection: summary.selection,
        baseline: summary.baseline,
        coachTargets: summary.coachTargets,
        selectedTotals: summary.selectedTotals,
        delta: summary.delta,
        hasSavedSelection: summary.hasSavedSelection,
      },
      false,
    );
  }, [globalMutate, summary]);

  const optionsByType = summary?.optionsByType;

  const baselineTotals = summary?.baselineTotals ?? emptyTotals();
  const coachTargetTotals = summary?.coachTargets ?? baselineTotals;
  const selectedTotals = useMemo(() => totalsFromItems(draftItems), [draftItems]);

  const delta = useMemo(
    () => ({
      calories: selectedTotals.calories - coachTargetTotals.calories,
      protein: selectedTotals.protein - coachTargetTotals.protein,
      carbs: selectedTotals.carbs - coachTargetTotals.carbs,
      fat: selectedTotals.fat - coachTargetTotals.fat,
    }),
    [selectedTotals, coachTargetTotals],
  );

  const selectedByType = useMemo(() => {
    return draftItems.reduce<Record<MealTypeKey, SelectionItem[]>>(
      (acc, item) => {
        acc[item.mealType].push(item);
        return acc;
      },
      { BREAKFAST: [], LUNCH: [], DINNER: [], SNACK: [] },
    );
  }, [draftItems]);

  const hasRequiredSlots = REQUIRED_TYPES.every(type => selectedByType[type].length === 1);
  const snackCount = selectedByType.SNACK.length;
  const isSnackFull = snackCount >= snackMax;

  const hasChanges = useMemo(() => {
    const source = summary?.selection?.items ?? [];
    if (source.length !== draftItems.length) return true;

    const sourceKey = source
      .map(item => `${item.mealType}:${item.slotIndex}:${item.mealId}:${item.sourceAssignmentId ?? ''}`)
      .sort()
      .join('|');
    const draftKey = draftItems
      .map(item => `${item.mealType}:${item.slotIndex}:${item.mealId}:${item.sourceAssignmentId ?? ''}`)
      .sort()
      .join('|');

    return sourceKey !== draftKey;
  }, [summary?.selection?.items, draftItems]);

  function selectOption(option: MealOption) {
    setHasTouchedDraft(true);
    setSaveError(null);

    setDraftItems(previous => {
      const current = [...previous];

      if (option.mealType === 'SNACK') {
        const existingSnackIndex = current.findIndex(
          item => item.mealType === 'SNACK' && item.mealId === option.meal.id,
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
            side: option.side ?? null,
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
          side: option.side ?? null,
          meal: option.meal,
        },
      ];
    });
  }

  function resetDraftToSaved() {
    setDraftItems(summary?.selection?.items ?? []);
    setHasTouchedDraft(false);
    setSaveError(null);
  }

  async function saveDraft(overrideItems: SelectionItem[] | null = null) {
    if (!enabled) {
      return false;
    }

    const itemsToSave = overrideItems ?? draftItems;
    const snackCountToSave = itemsToSave.filter(item => item.mealType === 'SNACK').length;

    if (snackCountToSave > snackMax) {
      setSaveError({ message: 'You can select up to two snacks', status: 400 });
      return false;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await saveUserMealSelection({
        name: 'Current',
        items: itemsToSave.map(item => ({
          mealType: item.mealType,
          slotIndex: item.slotIndex,
          mealId: item.mealId,
          sourceAssignmentId: item.sourceAssignmentId ?? null,
        })),
      });

      setDraftItems(result.selection.items ?? itemsToSave);
      setHasTouchedDraft(false);

      const baseSummary = summarySWR.data;
      if (baseSummary) {
        const nextSummary: MealPlanSummaryResponse = {
          ...baseSummary,
          selection: result.selection,
          baseline: result.baseline,
          selectedTotals: result.selectedTotals,
          delta: result.delta,
          hasSavedSelection: result.hasSavedSelection,
        };

        globalMutate(
          USER_MEAL_OPTIONS_URL,
          {
            optionsByType: nextSummary.optionsByType,
            baselineSelection: nextSummary.baselineSelection,
            baselineTotals: nextSummary.baselineTotals,
            coachTargets: nextSummary.coachTargets,
            constraints: nextSummary.constraints,
          },
          false,
        );

        globalMutate(
          USER_MEAL_SELECTION_URL,
          {
            selection: nextSummary.selection,
            baseline: nextSummary.baseline,
            coachTargets: nextSummary.coachTargets,
            selectedTotals: nextSummary.selectedTotals,
            delta: nextSummary.delta,
            hasSavedSelection: nextSummary.hasSavedSelection,
          },
          false,
        );
      }

      await summarySWR.mutate();

      return true;
    } catch (error) {
      setSaveError(error as ApiError);
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  function isSelected(mealType: MealTypeKey, mealId: string, sourceAssignmentId?: string | null): boolean {
    return draftItems.some(item => {
      if (item.mealType !== mealType || item.mealId !== mealId) {
        return false;
      }

      if (sourceAssignmentId) {
        return item.sourceAssignmentId === sourceAssignmentId;
      }

      return true;
    });
  }

  const loading = summarySWR.isLoading;
  const error = summarySWR.error as ApiError | undefined;

  return {
    loading,
    error,
    saveError,
    optionsByType,
    sideOptions,
    draftItems,
    selectedByType,
    selectedTotals,
    baselineTotals,
    coachTargetTotals,
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
