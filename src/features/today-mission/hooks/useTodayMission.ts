'use client';

import { useMemo } from 'react';
import { buildTodayMissionSummary } from '@/features/today-mission/lib/todayMission';
import type { TodayMissionSummary } from '@/features/today-mission/types/todayMission.types';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';

export function useTodayMission(summary: UserDashboardSummary) {
  const mission = useMemo<TodayMissionSummary>(() => {
    return buildTodayMissionSummary({
      completedMeals: summary.adherence.completion.completedCount,
      totalMeals: summary.adherence.completion.totalSelectedCount,
      actualTotals: summary.adherence.actualTotals,
      targetTotals: summary.adherence.targetTotals,
      nutritionStatus: summary.dailyCheckIn.nutritionStatus,
      dailyCheckInComplete: summary.dailyCheckIn.isComplete,
      unreadCount: summary.unreadTotal,
      streakCount: summary.streakCount,
    });
  }, [
    summary.adherence.actualTotals,
    summary.adherence.completion.completedCount,
    summary.adherence.completion.totalSelectedCount,
    summary.adherence.targetTotals,
    summary.dailyCheckIn.isComplete,
    summary.dailyCheckIn.nutritionStatus,
    summary.streakCount,
    summary.unreadTotal,
  ]);

  return {
    summary: mission,
    isLoading: false,
    error: null,
  };
}
