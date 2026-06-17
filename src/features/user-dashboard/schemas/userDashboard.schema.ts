import { z } from 'zod';
import { dailyNutritionStatusSchema } from '@/features/daily-nutrition/schemas/dailyNutrition.schema';
import { dailyTrainingStatusSchema } from '@/features/daily-training/schemas/dailyTraining.schema';
import { dayDateKeySchema } from '@/features/daily-checkin/schemas/dailyCheckIn.schema';
import { weekStartDateSchema } from '@/features/weekly-checkin/schemas/weeklyCheckIn.schema';

export const mealMacroTotalsSchema = z.object({
  calories: z.number().finite(),
  protein: z.number().finite(),
  carbs: z.number().finite(),
  fat: z.number().finite(),
});

export const userDashboardFeatureVisibilitySchema = z.object({
  dailyCheckinsEnabled: z.boolean(),
  dailyWeightEnabled: z.boolean(),
  weeklyCheckinsEnabled: z.boolean(),
  weightChartEnabled: z.boolean(),
  progressPhotosEnabled: z.boolean(),
  nutritionTrackingEnabled: z.boolean(),
  workoutTrackingEnabled: z.boolean(),
});

export const userDashboardUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable(),
  motivationalMessage: z.string().nullable(),
  currentWeight: z.number().nullable(),
  goalWeight: z.number().nullable(),
});

export const userDashboardDailyCheckInSchema = z.object({
  dayDate: dayDateKeySchema,
  isComplete: z.boolean(),
  nutritionStatus: dailyNutritionStatusSchema.nullable(),
  trainingStatus: dailyTrainingStatusSchema.nullable(),
});

export const userDashboardWeeklyCheckInSchema = z.object({
  weekStartDate: weekStartDateSchema,
  status: z.enum(['completed', 'due', 'overdue']),
});

export const userDashboardAdherenceSchema = z.object({
  dayDate: dayDateKeySchema,
  completion: z.object({
    completedCount: z.number().int().min(0),
    totalSelectedCount: z.number().int().min(0),
    percentage: z.number().int().min(0).max(100),
  }),
  selectedTotals: mealMacroTotalsSchema,
  actualTotals: mealMacroTotalsSchema,
  targetTotals: mealMacroTotalsSchema,
});

export const userDashboardSummarySchema = z.object({
  generatedAt: z.string(),
  user: userDashboardUserSchema,
  unreadTotal: z.number().int().min(0),
  streakCount: z.number().int().min(0),
  featureVisibility: userDashboardFeatureVisibilitySchema,
  dailyCheckIn: userDashboardDailyCheckInSchema,
  weeklyCheckIn: userDashboardWeeklyCheckInSchema,
  adherence: userDashboardAdherenceSchema,
});
