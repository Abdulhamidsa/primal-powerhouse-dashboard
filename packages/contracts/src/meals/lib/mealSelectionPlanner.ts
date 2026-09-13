import type { MealMacroTotals, MealOption, MealTypeKey, SelectionItem } from '../types/mealSelection.types';

export type MealSelectionInsightTone = 'neutral' | 'good' | 'warn';

export type MealSelectionInsight = {
  tone: MealSelectionInsightTone;
  title: string;
  description: string;
  helper: string;
};

export function emptyTotals(): MealMacroTotals {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function totalsFromSelectionItems(items: SelectionItem[]): MealMacroTotals {
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

export function groupSelectionItemsByType(items: SelectionItem[]): Record<MealTypeKey, SelectionItem[]> {
  return items.reduce<Record<MealTypeKey, SelectionItem[]>>(
    (acc, item) => {
      acc[item.mealType].push(item);
      return acc;
    },
    { BREAKFAST: [], LUNCH: [], DINNER: [], SNACK: [] },
  );
}

export function hasMealSelectionChanges(source: SelectionItem[], draft: SelectionItem[]): boolean {
  if (source.length !== draft.length) return true;

  const toKey = (item: SelectionItem) =>
    `${item.mealType}:${item.slotIndex}:${item.mealId}:${item.sourceAssignmentId ?? ''}`;

  return source.map(toKey).sort().join('|') !== draft.map(toKey).sort().join('|');
}

export function toggleMealSelectionItem(
  previous: SelectionItem[],
  option: MealOption,
  snackMax: number,
): SelectionItem[] {
  const current = [...previous];

  if (option.mealType === 'SNACK') {
    const existingSnackIndex = current.findIndex(item => item.mealType === 'SNACK' && item.mealId === option.meal.id);

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
}

function formatMacroGap(value: number, unit: string): string {
  const amount = Math.abs(Math.round(value));
  if (amount === 0) return '';
  return value > 0 ? `${amount}${unit} over` : `${amount}${unit} short`;
}

export function buildMealSelectionInsight({
  selectedTotals,
  targetTotals,
  snackCount,
  snackMax,
  hasRequiredSlots,
  hasChanges,
}: {
  selectedTotals: MealMacroTotals;
  targetTotals: MealMacroTotals;
  snackCount: number;
  snackMax: number;
  hasRequiredSlots: boolean;
  hasChanges: boolean;
}): MealSelectionInsight {
  const deltas = {
    calories: selectedTotals.calories - targetTotals.calories,
    protein: selectedTotals.protein - targetTotals.protein,
    carbs: selectedTotals.carbs - targetTotals.carbs,
    fat: selectedTotals.fat - targetTotals.fat,
  };

  const absoluteDeltas = Object.entries(deltas)
    .map(([key, value]) => [key as keyof MealMacroTotals, value] as const)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  const biggestGap = absoluteDeltas.find(([, value]) => value !== 0);
  const snackMessage =
    snackCount >= snackMax
      ? `Snack limit reached (${snackCount}/${snackMax}).`
      : `${snackCount}/${snackMax} snacks selected.`;

  if (hasRequiredSlots && !hasChanges) {
    return {
      tone: 'good',
      title: 'Ready to roll',
      description: 'Your core meals are locked in and your selection matches the saved plan.',
      helper: snackMessage,
    };
  }

  if (!hasRequiredSlots) {
    return {
      tone: 'warn',
      title: 'Finish the core meals',
      description: 'Complete breakfast, lunch, and dinner before fine-tuning the macro balance.',
      helper: snackMessage,
    };
  }

  if (!biggestGap) {
    return {
      tone: 'neutral',
      title: 'Selection looks balanced',
      description: 'Your chosen meals are close to target. Fine-tune if you want a tighter macro match.',
      helper: snackMessage,
    };
  }

  const [macroKey, gapValue] = biggestGap;
  const macroLabel = macroKey === 'calories' ? 'calories' : macroKey;
  const unit = macroKey === 'calories' ? ' kcal' : ' g';
  const gapLabel = formatMacroGap(gapValue, unit) || 'matched';

  return {
    tone: gapValue > 0 ? 'warn' : 'good',
    title: gapValue > 0 ? 'Slightly over target' : 'Close to target',
    description:
      gapValue > 0
        ? `You are ${gapLabel} on ${macroLabel}. Consider a lighter swap if you want to tighten the day.`
        : `You are ${gapLabel} on ${macroLabel}. A macro-friendly swap can bring this closer.`,
    helper: snackMessage,
  };
}
