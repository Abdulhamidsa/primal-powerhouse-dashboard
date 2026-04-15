import type { MealMacroTotals } from '@/features/meals/types/mealSelection.types';
import type { DailyNutritionStatus } from '@/features/daily-nutrition/types/dailyNutrition.types';

export type TodayMissionTone = 'neutral' | 'good' | 'warn' | 'danger';

export type TodayMissionMacroKey = keyof MealMacroTotals;

export type TodayMissionMacroProgress = {
  key: TodayMissionMacroKey;
  label: string;
  actual: number;
  target: number;
  remaining: number;
  progress: number;
  unit: string;
  tone: TodayMissionTone;
};

export type TodayMissionSignal = {
  label: string;
  value: string;
  tone: TodayMissionTone;
};

export type TodayMissionSummary = {
  title: string;
  badgeLabel: string;
  badgeTone: TodayMissionTone;
  headline: string;
  description: string;
  nextActionLabel: string;
  nextActionHref: string;
  mealProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  nutrition: {
    actual: MealMacroTotals;
    target: MealMacroTotals;
    remaining: MealMacroTotals;
  };
  macros: TodayMissionMacroProgress[];
  signals: TodayMissionSignal[];
  nutritionStatus: DailyNutritionStatus | null;
  unreadCount: number;
};

export type TodayMissionInput = {
  completedMeals: number;
  totalMeals: number;
  actualTotals: MealMacroTotals;
  targetTotals: MealMacroTotals;
  nutritionStatus: DailyNutritionStatus | null;
  dailyCheckInComplete: boolean;
  unreadCount: number;
  streakCount: number;
};
