import type { TodayMissionSummary } from '@/features/today-mission/types/todayMission.types';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';

export type DashboardPrimaryAction = {
  href: string;
  label: string;
};

type DashboardPrimaryActionInput = {
  summary: UserDashboardSummary;
  mealProgress: Pick<TodayMissionSummary, 'mealProgress'>;
  checkInEnabled: boolean;
  completeAction?: DashboardPrimaryAction;
  fallbackAction: DashboardPrimaryAction;
};

/**
 * Selects the single most useful dashboard action without changing the
 * server-derived dashboard snapshot or any underlying feature state.
 */
export function getDashboardPrimaryAction({
  summary,
  mealProgress,
  checkInEnabled,
  completeAction,
  fallbackAction,
}: DashboardPrimaryActionInput): DashboardPrimaryAction {
  if (summary.training.activeSessionId) {
    return summary.training.activeAssignmentId
      ? {
          href: `/user/workout/${encodeURIComponent(summary.training.activeAssignmentId)}`,
          label: 'Resume workout',
        }
      : { href: '/user/training', label: 'Continue workout' };
  }

  if (checkInEnabled && !summary.dailyCheckIn.isComplete) {
    return { href: '/user/check-ins', label: 'Complete check-in' };
  }

  const hasSelectedMeals = summary.featureVisibility.nutritionTrackingEnabled && mealProgress.mealProgress.total > 0;
  const mealsComplete = hasSelectedMeals && mealProgress.mealProgress.percentage === 100;

  if (hasSelectedMeals && !mealsComplete) {
    return { href: '/user/my-plan', label: 'Continue meal plan' };
  }

  const hasWorkout =
    summary.featureVisibility.workoutTrackingEnabled &&
    Boolean(summary.training.activePlanName || summary.training.activeAssignmentCount);
  const workoutComplete = !hasWorkout || summary.dailyCheckIn.trainingStatus === 'DONE';
  const checkInComplete = !checkInEnabled || summary.dailyCheckIn.isComplete;
  const mainTasksComplete = checkInComplete && (!hasSelectedMeals || mealsComplete) && workoutComplete;

  return mainTasksComplete && completeAction ? completeAction : fallbackAction;
}
