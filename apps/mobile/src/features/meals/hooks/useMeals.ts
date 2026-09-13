import { useState } from 'react';
import { useResource, useAction } from '@/features/resources/hooks/useResource';
import * as api from '../api/meals.api';
import { selectionSchema, toggleMealCompletionSchema } from '../schemas/meals.schema';
import type { MealOption, MealPickerState, MealTypeKey, SelectionItem, SideSelectionOption } from '../types/meals.types';
import { totalsFromSelectionItems } from '@primal/contracts/meals/lib/mealSelectionPlanner';
import { useConnection } from '@/features/resources/hooks/useConnection';

export function useMeals() {
  const { offline } = useConnection();
  const options = useResource('/api/user/meals/options', api.getMealOptions);
  const selection = useResource('/api/user/meals/selection', api.getMealSelection);
  const adherence = useResource('/api/user/adherence/current', api.getAdherence);
  const action = useAction(['/api/user/meals', '/api/user/adherence']);
  const [picker, setPicker] = useState<MealPickerState | null>(null);
  const [detail, setDetail] = useState<MealOption['meal'] | null>(null);
  const [sideDetail, setSideDetail] = useState<SideSelectionOption | null>(null);
  const items = (selection.data?.selection.items ?? []).map(item => {
    const totals = totalsFromSelectionItems([item]);
    return {
      ...item,
      nutritionLabel: `${totals.calories} kcal · ${totals.protein}g protein · ${totals.carbs}g carbs · ${totals.fat}g fat`,
      portionLabel: `${item.portion} portion${item.portion === 1 ? '' : 's'}${item.side ? ' + side' : ''}`,
    };
  });
  const nextSnackSlot =
    [0, 1].find(slot => !items.some(item => item.mealType === 'SNACK' && item.slotIndex === slot)) ?? 0;
  const optionCards = (picker ? (options.data?.optionsByType[picker.type] ?? []) : []).filter(option => !picker?.sidesOnly || Boolean(option.side)).map(option => {
    const totals = totalsFromSelectionItems([{ ...option, slotIndex: picker?.slot ?? 0, mealId: option.meal.id }]);
    return { ...option, nutritionLabel: `${totals.calories} kcal · ${totals.protein}g protein` };
  });
  const totals = selection.data?.selectedTotals;
  const targets = selection.data?.coachTargets ?? options.data?.coachTargets;
  const completed = (item: SelectionItem) =>
    adherence.data?.completions.some(
      c => c.mealId === item.mealId && c.mealType === item.mealType && c.slotIndex === item.slotIndex,
    ) ?? false;
  async function choose(option: MealOption) {
    if (!picker) return;
    const replacement = {
      mealType: picker.type,
      slotIndex: picker.slot,
      mealId: option.meal.id,
      sourceAssignmentId: option.sourceAssignmentId,
    };
    const next = [
      ...items.filter(item => !(item.mealType === picker.type && item.slotIndex === picker.slot)),
      replacement,
    ];
    const result = await action.run(() => api.saveMealSelection(selectionSchema.parse({ items: next })));
    if (result) setPicker(null);
  }
  return {
    offline,
    nextSnackSlot,
    options,
    optionCards,
    summaryLabel: totals
      ? `${Math.round(totals.calories)} kcal · ${Math.round(totals.protein)}g protein · ${Math.round(totals.carbs)}g carbs · ${Math.round(totals.fat)}g fat`
      : '',
    targetLabel: targets
      ? `Coach target: ${Math.round(targets.calories)} kcal · ${Math.round(targets.protein)}g protein`
      : '',
    selection,
    adherence,
    action,
    items,
    picker,
    setPicker,
    detail,
    setDetail,
    sideDetail,
    setSideDetail,
    choose,
    completed,
    completionReady: !!adherence.data,
    toggle: (item: SelectionItem) =>
      action.run(() =>
        api.toggleCompletion(
          toggleMealCompletionSchema.parse({
            dayDate: adherence.data?.dayDate,
            mealType: item.mealType,
            slotIndex: item.slotIndex,
            mealId: item.mealId,
            sourceAssignmentId: item.sourceAssignmentId,
            portion: item.portion,
            calories: item.meal.calories,
            protein: item.meal.protein,
            carbs: item.meal.carbs,
            fat: item.meal.fat,
          }),
          completed(item),
        ),
      ),
    refresh: () => Promise.allSettled([options.refresh(), selection.refresh(), adherence.refresh()]),
  };
}
export function formatMealText(raw?: string | null) {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return parsed
        .map(item =>
          typeof item === 'string'
            ? item
            : [item.quantity, item.unit, item.name ?? item.foodName ?? item.ingredient].filter(Boolean).join(' '),
        )
        .join('\n');
  } catch {}
  return raw;
}
