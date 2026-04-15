import type { MealMacroTotals } from '@/features/meals/types/mealSelection.types';
import type {
  TodayMissionInput,
  TodayMissionMacroProgress,
  TodayMissionSignal,
  TodayMissionSummary,
  TodayMissionTone,
} from '../types/todayMission.types';

function emptyTotals(): MealMacroTotals {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getToneFromProgress(actual: number, target: number): TodayMissionTone {
  if (target <= 0) return 'neutral';
  if (actual >= target) return 'good';
  if (actual >= target * 0.7) return 'warn';
  return 'danger';
}

export function formatMissionDelta(value: number, unit: string): string {
  const absValue = Math.abs(Math.round(value));

  if (value === 0) {
    return 'Matched';
  }

  return value > 0 ? `${absValue}${unit} left` : `${absValue}${unit} over`;
}

function buildMacroProgress(
  label: string,
  key: keyof MealMacroTotals,
  actual: number,
  target: number,
  unit: string,
): TodayMissionMacroProgress {
  const remaining = Math.round(target - actual);
  const progress = target > 0 ? clampPercentage((actual / target) * 100) : 0;

  return {
    key,
    label,
    actual: Math.round(actual),
    target: Math.round(target),
    remaining,
    progress,
    unit,
    tone: getToneFromProgress(actual, target),
  };
}

export function buildTodayMissionSummary(input: TodayMissionInput): TodayMissionSummary {
  const targetTotals = input.targetTotals ?? emptyTotals();
  const actualTotals = input.actualTotals ?? emptyTotals();

  const completedMeals = Math.max(0, input.completedMeals);
  const totalMeals = Math.max(0, input.totalMeals);
  const completionPercentage = totalMeals > 0 ? clampPercentage((completedMeals / totalMeals) * 100) : 0;
  const hasPlan =
    totalMeals > 0 ||
    targetTotals.calories > 0 ||
    targetTotals.protein > 0 ||
    targetTotals.carbs > 0 ||
    targetTotals.fat > 0;

  const macros = [
    buildMacroProgress('Calories', 'calories', actualTotals.calories, targetTotals.calories, 'kcal'),
    buildMacroProgress('Protein', 'protein', actualTotals.protein, targetTotals.protein, 'g'),
    buildMacroProgress('Carbs', 'carbs', actualTotals.carbs, targetTotals.carbs, 'g'),
    buildMacroProgress('Fat', 'fat', actualTotals.fat, targetTotals.fat, 'g'),
  ];

  let badgeLabel = 'Set up today';
  let badgeTone: TodayMissionTone = 'neutral';
  let headline = 'Build your meal plan';
  let description = 'Choose meals in My Plan to unlock calories and macros for today.';
  let nextActionLabel = 'Open My Plan';
  let nextActionHref = '/user/my-plan';

  if (hasPlan) {
    if (completionPercentage === 100 && input.dailyCheckInComplete) {
      badgeLabel = 'On track';
      badgeTone = 'good';
      headline = 'You are on track today';
      description = 'Your meal plan is complete and your daily check-in is done.';
      nextActionLabel = input.unreadCount > 0 ? 'Read coach message' : 'Review My Plan';
      nextActionHref = input.unreadCount > 0 ? '/user/chat' : '/user/my-plan';
    } else if (completionPercentage >= 70) {
      badgeLabel = 'Mostly on track';
      badgeTone = 'warn';
      headline = 'You are building momentum';
      description = `${completedMeals} of ${totalMeals} meals are done. Finish the rest to lock in today's targets.`;
      nextActionLabel = 'Finish My Plan';
      nextActionHref = '/user/my-plan';
    } else if (completedMeals > 0) {
      badgeLabel = 'Needs attention';
      badgeTone = 'warn';
      headline = 'Keep the plan moving';
      description = `${completedMeals} of ${totalMeals} meals are complete. Focus on the next meal to stay close to target.`;
      nextActionLabel = 'Open My Plan';
      nextActionHref = '/user/my-plan';
    } else {
      badgeLabel = 'Needs attention';
      badgeTone = 'danger';
      headline = 'Start with your first meal';
      description = 'Nothing is marked complete yet. A single meal gets the plan moving again.';
      nextActionLabel = 'Start My Plan';
      nextActionHref = '/user/my-plan';
    }
  }

  const signals: TodayMissionSignal[] = [
    {
      label: 'Meals',
      value: hasPlan ? `${completedMeals}/${totalMeals} done` : 'No plan yet',
      tone: completionPercentage === 100 ? 'good' : completionPercentage > 0 ? 'warn' : 'neutral',
    },
    {
      label: 'Check-in',
      value: input.dailyCheckInComplete ? 'Completed' : 'Due',
      tone: input.dailyCheckInComplete ? 'good' : 'warn',
    },
    {
      label: 'Coach',
      value: input.unreadCount > 0 ? `${input.unreadCount} unread` : 'No new messages',
      tone: input.unreadCount > 0 ? 'warn' : 'neutral',
    },
  ];

  const remaining = {
    calories: Math.round(targetTotals.calories - actualTotals.calories),
    protein: Math.round(targetTotals.protein - actualTotals.protein),
    carbs: Math.round(targetTotals.carbs - actualTotals.carbs),
    fat: Math.round(targetTotals.fat - actualTotals.fat),
  };

  if (!hasPlan) {
    badgeLabel = 'No plan';
    badgeTone = 'neutral';
    headline = 'Build your meal plan';
    description = 'Choose meals in My Plan to unlock calories, macros, and progress.';
    nextActionLabel = 'Open My Plan';
    nextActionHref = '/user/my-plan';
  }

  if (input.streakCount > 0 && hasPlan) {
    description = `${description} You are on a ${input.streakCount}-day streak.`;
  }

  if (input.dailyCheckInComplete && hasPlan && badgeTone !== 'good') {
    description = `${description} Your daily check-in is complete.`;
  }

  return {
    title: "Today's Mission",
    badgeLabel,
    badgeTone,
    headline,
    description,
    nextActionLabel,
    nextActionHref,
    mealProgress: {
      completed: completedMeals,
      total: totalMeals,
      percentage: completionPercentage,
    },
    nutrition: {
      actual: actualTotals,
      target: targetTotals,
      remaining,
    },
    macros,
    signals,
    nutritionStatus: input.nutritionStatus,
    unreadCount: input.unreadCount,
  };
}
