import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/request';
import { saveUserMealSelection, USER_MEAL_OPTIONS_URL, USER_MEAL_SELECTION_URL } from '@/features/meals/api/mealSelection.api';
import { getUserMealPlanSummary, USER_MEAL_PLAN_SUMMARY_URL } from '@/features/meals/api/mealPlan.api';
import { USER_DASHBOARD_SUMMARY_URL } from '@/features/user-dashboard/api/userDashboard.api';
import type {
  MealOption,
  MealTypeKey,
  SelectionItem,
  SideProgramOption,
} from '@/features/meals/types/mealSelection.types';
import type { MealPlanSummaryResponse } from '@/features/meals/types/mealPlanSummary.types';
import {
  buildMealSelectionInsight,
  emptyTotals,
  groupSelectionItemsByType,
  hasMealSelectionChanges,
  toggleMealSelectionItem,
  totalsFromSelectionItems,
} from '@/features/meals/lib/mealSelectionPlanner';

const REQUIRED_TYPES: MealTypeKey[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

export function useMealSelectionPlanner(enabled = true) {
  const { mutate: globalMutate } = useSWRConfig();
  const summarySWR = useSWR(enabled ? USER_MEAL_PLAN_SUMMARY_URL : null, getUserMealPlanSummary, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
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
  const selectedTotals = useMemo(() => totalsFromSelectionItems(draftItems), [draftItems]);

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
    return groupSelectionItemsByType(draftItems);
  }, [draftItems]);

  const hasRequiredSlots = REQUIRED_TYPES.every(type => selectedByType[type].length === 1);
  const snackCount = selectedByType.SNACK.length;
  const isSnackFull = snackCount >= snackMax;

  const hasChanges = useMemo(() => {
    const source = summary?.selection?.items ?? [];
    return hasMealSelectionChanges(source, draftItems);
  }, [summary?.selection?.items, draftItems]);

  function selectOption(option: MealOption) {
    setHasTouchedDraft(true);
    setSaveError(null);
    setDraftItems(previous => toggleMealSelectionItem(previous, option, snackMax));
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
      await globalMutate(USER_DASHBOARD_SUMMARY_URL);

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
    insight: buildMealSelectionInsight({
      selectedTotals,
      targetTotals: coachTargetTotals,
      snackCount,
      snackMax,
      hasRequiredSlots,
      hasChanges,
    }),
  };
}
