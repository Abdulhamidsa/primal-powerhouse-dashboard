import { revalidateTag } from 'next/cache';

export const CACHE_TAGS = {
  meals: 'meals',
  mealPlans: 'meal-plans',
  mealAssignments: 'meal-assignments',
  videos: 'videos',
  videoAssignments: 'video-assignments',
  userVideos: 'user-videos',
  workoutPlans: 'workout-plans',
  workoutPlanAssignments: 'workout-plan-assignments',
  workoutSessions: 'workout-sessions',
} as const;

export function userDashboardSummaryTag(clientId: string): string {
  return `client:${clientId}:user-dashboard-summary`;
}

export function mealTag(mealId: string): string {
  return `meal:${mealId}`;
}

export function mealPlanTag(mealPlanId: string): string {
  return `meal-plan:${mealPlanId}`;
}

export function mealAssignmentTag(assignmentId: string): string {
  return `meal-assignment:${assignmentId}`;
}

export function videoTag(videoId: string): string {
  return `video:${videoId}`;
}

export function videoAssignmentTag(assignmentId: string): string {
  return `video-assignment:${assignmentId}`;
}

export function clientMealPlansTag(clientId: string): string {
  return `client:${clientId}:meal-plans`;
}

export function clientVideoAssignmentsTag(clientId: string): string {
  return `client:${clientId}:video-assignments`;
}

export function userVideosTag(userId: string): string {
  return `user:${userId}:videos`;
}

export function invalidateMealCaches(options?: {
  mealId?: string;
  mealPlanId?: string;
  clientId?: string;
  mealAssignmentId?: string;
}): void {
  revalidateTag(CACHE_TAGS.meals);
  revalidateTag(CACHE_TAGS.mealPlans);
  revalidateTag(CACHE_TAGS.mealAssignments);

  if (options?.mealId) {
    revalidateTag(mealTag(options.mealId));
  }

  if (options?.mealPlanId) {
    revalidateTag(mealPlanTag(options.mealPlanId));
  }

  if (options?.clientId) {
    revalidateTag(clientMealPlansTag(options.clientId));
  }

  if (options?.mealAssignmentId) {
    revalidateTag(mealAssignmentTag(options.mealAssignmentId));
  }
}

export function invalidateVideoCaches(options?: {
  videoId?: string;
  clientId?: string;
  videoAssignmentId?: string;
  userId?: string;
}): void {
  revalidateTag(CACHE_TAGS.videos);
  revalidateTag(CACHE_TAGS.videoAssignments);
  revalidateTag(CACHE_TAGS.userVideos);

  if (options?.videoId) {
    revalidateTag(videoTag(options.videoId));
  }

  if (options?.clientId) {
    revalidateTag(clientVideoAssignmentsTag(options.clientId));
  }

  if (options?.videoAssignmentId) {
    revalidateTag(videoAssignmentTag(options.videoAssignmentId));
  }

  if (options?.userId) {
    revalidateTag(userVideosTag(options.userId));
  }
}

export function workoutPlanTag(planId: string): string {
  return `workout-plan:${planId}`;
}

export function clientWorkoutPlansTag(clientId: string): string {
  return `client:${clientId}:workout-plans`;
}

export function clientWorkoutSessionsTag(clientId: string): string {
  return `client:${clientId}:workout-sessions`;
}

export function coachWorkoutPlansTag(coachId: string): string {
  return `coach:${coachId}:workout-plans`;
}

export function invalidateWorkoutCaches(options?: { planId?: string; clientId?: string; coachId?: string }): void {
  revalidateTag(CACHE_TAGS.workoutPlans);
  revalidateTag(CACHE_TAGS.workoutPlanAssignments);
  revalidateTag(CACHE_TAGS.workoutSessions);

  if (options?.planId) {
    revalidateTag(workoutPlanTag(options.planId));
  }

  if (options?.clientId) {
    revalidateTag(clientWorkoutPlansTag(options.clientId));
    revalidateTag(clientWorkoutSessionsTag(options.clientId));
  }

  if (options?.coachId) {
    revalidateTag(coachWorkoutPlansTag(options.coachId));
  }
}

export function invalidateUserDashboardSummaryCaches(options?: { clientId?: string }): void {
  if (options?.clientId) {
    revalidateTag(userDashboardSummaryTag(options.clientId));
  }
}
