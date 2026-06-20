'use client';

import { useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/request';
import {
  buildAdherenceCurrentUrl,
  createMealCompletion,
  deleteMealCompletion,
  getAdherenceCurrent,
} from '@/features/adherence/api/adherence.api';
import { USER_DASHBOARD_SUMMARY_URL } from '@/features/user-dashboard/api/userDashboard.api';
import type { MealTypeKey, SelectionItem } from '@/features/meals/types/mealSelection.types';

function getTodayDateKeyLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toCompletionKey(item: { mealType: MealTypeKey; slotIndex: number; mealId: string }): string {
  return `${item.mealType}:${item.slotIndex}:${item.mealId}`;
}

export function useMealAdherenceToday() {
  const { mutate } = useSWRConfig();
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const dayDate = getTodayDateKeyLocal();
  const key = buildAdherenceCurrentUrl(dayDate);

  const { data, error, isLoading, isValidating } = useSWR(key, () => getAdherenceCurrent(dayDate), {
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  const completionKeys = useMemo(() => {
    const set = new Set<string>();
    for (const completion of data?.completions ?? []) {
      set.add(
        toCompletionKey({
          mealType: completion.mealType,
          slotIndex: completion.slotIndex,
          mealId: completion.mealId,
        }),
      );
    }
    return set;
  }, [data?.completions]);

  const toggleCompletion = async (item: SelectionItem) => {
    const completionKey = toCompletionKey(item);
    const isCompleted = completionKeys.has(completionKey);

    setPendingKeys(prev => new Set(prev).add(completionKey));

    try {
      const payload = {
        dayDate,
        mealType: item.mealType,
        slotIndex: item.slotIndex,
        mealId: item.mealId,
        sourceAssignmentId: item.sourceAssignmentId ?? null,
        portion: item.portion,
        calories: item.meal.calories,
        protein: item.meal.protein,
        carbs: item.meal.carbs,
        fat: item.meal.fat,
      };

      if (isCompleted) {
        await deleteMealCompletion(payload);
      } else {
        await createMealCompletion(payload);
      }

      await Promise.all([mutate(key), mutate(USER_DASHBOARD_SUMMARY_URL)]);
    } finally {
      setPendingKeys(prev => {
        const next = new Set(prev);
        next.delete(completionKey);
        return next;
      });
    }
  };

  return {
    dayDate,
    summary: data,
    isLoading,
    isValidating,
    error: error as ApiError | undefined,
    isCompleted: (item: SelectionItem) => completionKeys.has(toCompletionKey(item)),
    isPending: (item: SelectionItem) => pendingKeys.has(toCompletionKey(item)),
    toggleCompletion,
  };
}
