import type { z } from 'zod';
import type {
  userDashboardActionSchema,
  mealMacroTotalsSchema,
  userDashboardAdherenceSchema,
  userDashboardDailyCheckInSchema,
  userDashboardFeatureVisibilitySchema,
  userDashboardPendingAttentionSchema,
  userDashboardResumeRouteSchema,
  userDashboardSummarySchema,
  userDashboardTodayCompletionSchema,
  userDashboardTrainingSnapshotSchema,
  userDashboardUserSchema,
  userDashboardWeeklyCheckInSchema,
} from '@/features/user-dashboard/schemas/userDashboard.schema';

export type MealMacroTotals = z.infer<typeof mealMacroTotalsSchema>;
export type UserDashboardUser = z.infer<typeof userDashboardUserSchema>;
export type UserDashboardFeatureVisibility = z.infer<typeof userDashboardFeatureVisibilitySchema>;
export type UserDashboardDailyCheckIn = z.infer<typeof userDashboardDailyCheckInSchema>;
export type UserDashboardWeeklyCheckIn = z.infer<typeof userDashboardWeeklyCheckInSchema>;
export type UserDashboardAdherence = z.infer<typeof userDashboardAdherenceSchema>;
export type UserDashboardTraining = z.infer<typeof userDashboardTrainingSnapshotSchema>;
export type UserDashboardAction = z.infer<typeof userDashboardActionSchema>;
export type UserDashboardResumeRoute = z.infer<typeof userDashboardResumeRouteSchema>;
export type UserDashboardTodayCompletionState = z.infer<typeof userDashboardTodayCompletionSchema>;
export type UserDashboardPendingAttention = z.infer<typeof userDashboardPendingAttentionSchema>;
export type UserDashboardSummary = z.infer<typeof userDashboardSummarySchema>;
