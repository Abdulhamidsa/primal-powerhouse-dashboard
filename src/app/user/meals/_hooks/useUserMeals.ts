import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { ApiError } from '@/lib/fetcher';
import { MEAL_TYPES, MealAssignment, MealsTab, MealType } from '..';

export function useUserMeals() {
  const [activeTab, setActiveTab] = useState<MealsTab>('all');
  const [activeMealType, setActiveMealType] = useState<MealType>('BREAKFAST');

  const todaySWR = useSWR<Record<string, MealAssignment | undefined>, ApiError>(
    '/api/user/meals/today',
    url => fetcher(url),
    { revalidateOnFocus: true }
  );

  const allSWR = useSWR<MealAssignment[], ApiError>('/api/user/meals', url => fetcher(url), {
    revalidateOnFocus: true,
  });

  const error = activeTab === 'today' ? todaySWR.error : allSWR.error;

  const isLoading = activeTab === 'today' ? !todaySWR.data && todaySWR.isLoading : !allSWR.data && allSWR.isLoading;

  const emptyState = activeTab === 'today' ? 'No meals for today yet.' : 'No meals assigned yet.';

  const assignments: MealAssignment[] = useMemo(() => {
    if (activeTab === 'today') {
      return Object.values(todaySWR.data ?? {}).filter(Boolean) as MealAssignment[];
    }
    return allSWR.data ?? [];
  }, [activeTab, todaySWR.data, allSWR.data]);

  const sections = useMemo(() => {
    return (MEAL_TYPES as readonly MealType[])
      .map(type => ({
        type,
        items: assignments.filter(a => a.mealType?.toUpperCase() === type),
      }))
      .filter(section => section.items.length > 0);
  }, [assignments]);

  const refresh = async () => {
    if (activeTab === 'today') {
      await todaySWR.mutate();
      return;
    }
    await allSWR.mutate();
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] ?? 'Unknown';
  };

  return {
    activeTab,
    setActiveTab,
    activeMealType,
    setActiveMealType,

    sections,
    emptyState,
    getDayName,

    isLoading,
    error,

    refresh,
  };
}
