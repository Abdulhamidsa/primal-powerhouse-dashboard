import type { z } from 'zod';
import type {
  mealMacroTotalsSchema,
  userDashboardAdherenceSchema,
  userDashboardDailyCheckInSchema,
  userDashboardFeatureVisibilitySchema,
  userDashboardSummarySchema,
  userDashboardUserSchema,
  userDashboardWeeklyCheckInSchema,
} from '@/features/user-dashboard/schemas/userDashboard.schema';

export type MealMacroTotals = z.infer<typeof mealMacroTotalsSchema>;
export type UserDashboardUser = z.infer<typeof userDashboardUserSchema>;
export type UserDashboardFeatureVisibility = z.infer<typeof userDashboardFeatureVisibilitySchema>;
export type UserDashboardDailyCheckIn = z.infer<typeof userDashboardDailyCheckInSchema>;
export type UserDashboardWeeklyCheckIn = z.infer<typeof userDashboardWeeklyCheckInSchema>;
export type UserDashboardAdherence = z.infer<typeof userDashboardAdherenceSchema>;
export type UserDashboardSummary = z.infer<typeof userDashboardSummarySchema>;
