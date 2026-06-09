'use client';

import { useMemo } from 'react';
import { useChatUnread } from '@/features/client-coach-messaging/hooks/useChatUnread';
import { useMealAdherenceToday } from '@/features/adherence/hooks/useMealAdherence';
import { useMealSelectionPlanner } from '@/features/meals/hooks/useMealSelectionPlanner';
import { useDailyCheckInToday, useDailyCheckInInsights } from '@/features/daily-checkin/hooks/useDailyCheckIn';
import { buildTodayMissionSummary } from '@/features/today-mission/lib/todayMission';
import type { TodayMissionSummary } from '@/features/today-mission/types/todayMission.types';

export function useTodayMission(enabled = true) {
  const mealPlanner = useMealSelectionPlanner(enabled);
  const adherence = useMealAdherenceToday();
  const dailyCheckIn = useDailyCheckInToday();
  const dailyInsights = useDailyCheckInInsights();
  const chatUnread = useChatUnread();

  const summary = useMemo<TodayMissionSummary>(() => {
    return buildTodayMissionSummary({
      completedMeals: adherence.summary?.completion.completedCount ?? 0,
      totalMeals: adherence.summary?.completion.totalSelectedCount ?? 0,
      actualTotals: adherence.summary?.effectiveTotals ?? mealPlanner.coachTargetTotals,
      targetTotals: mealPlanner.coachTargetTotals,
      nutritionStatus: dailyCheckIn.entry?.nutritionStatus ?? null,
      dailyCheckInComplete: Boolean(dailyCheckIn.entry?.isComplete),
      unreadCount: chatUnread.unreadTotal,
      streakCount: dailyInsights.summary?.streakCount ?? 0,
    });
  }, [
    adherence.summary?.completion.completedCount,
    adherence.summary?.completion.totalSelectedCount,
    adherence.summary?.effectiveTotals,
    mealPlanner.coachTargetTotals,
    dailyCheckIn.entry?.nutritionStatus,
    dailyCheckIn.entry?.isComplete,
    chatUnread.unreadTotal,
    dailyInsights.summary?.streakCount,
  ]);

  const isLoading =
    !enabled ||
    mealPlanner.loading ||
    adherence.isLoading ||
    dailyCheckIn.isLoading ||
    dailyInsights.isLoading ||
    chatUnread.isLoading;
  const error = mealPlanner.error || adherence.error || dailyCheckIn.error || dailyInsights.error || chatUnread.error;

  return {
    summary,
    isLoading,
    error,
  };
}
