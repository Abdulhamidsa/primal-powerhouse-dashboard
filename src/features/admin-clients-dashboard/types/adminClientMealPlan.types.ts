import type { MealAssignment } from '@/lib/client-page/types';

export type AdminClientMealPlan = {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
  clientId: string;
  mealAssignments: MealAssignment[];
};
