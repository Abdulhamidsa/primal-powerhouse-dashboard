import type { VideoAssignment } from '@/types/video';
import type { MealAssignment, ActiveMealPlanSummary } from '@/lib/client-page/types';
import type { AdminClientWeeklyCheckInsResponse } from '@/features/weekly-checkin/types/adminWeeklyCheckIn.types';

export type LeftPaneMode = 'list' | 'chat' | 'notes';

export type DashboardTabKey = 'summary' | 'nutrition' | 'assignments' | 'check-ins';

export type AdminClientListItem = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  notes: string | null;
  currentWeight: number | null;
  targetWeight: number | null;
  updatedAt: string;
};

export type AdminClientDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  age: number | null;
  gender: 'MALE' | 'FEMALE' | null;
  activityLevel: string | null;
  height: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  goals: string[];
  dietaryRestrictions: string[];
  notes: string | null;
  sessionsCompleted: number | null;
  goalCalories: number | null;
  goalMacros: string | null;
};

export type ClientNoteEntry = {
  id: string;
  message: string;
  actor: string;
  timestampLabel: string;
};

export type ClientNotesState = {
  entries: ClientNoteEntry[];
  rawNotes: string;
};

export type AdminClientAssignmentsData = {
  mealAssignments: MealAssignment[];
  activeMealPlan: ActiveMealPlanSummary | null;
  videoAssignments: VideoAssignment[];
};

export type AdminClientDashboardData = {
  client: AdminClientDetail | null;
  assignments: AdminClientAssignmentsData;
  weeklyCheckIns: AdminClientWeeklyCheckInsResponse | null;
};
