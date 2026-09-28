export type UserDashboardMeal = {
  id: string;
  name: string;
  type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  ingredients: string | null;
  instructions: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number;
  imageUrl: string | null;
};

export type UserDashboardMealAssignment = {
  id: string;
  dayOfWeek: number;
  mealType: string;
  portion: number;
  scheduledTime: string | null;
  notes: string | null;
  meal: UserDashboardMeal;
};

export type UserDashboardMealPlan = {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  mealAssignments: UserDashboardMealAssignment[];
};

export type UserDashboardVideo = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl: string | null;
  equipment: string | null;
  muscleGroups: string | null;
  tags: string | null;
  instructions: string | null;
  tips: string | null;
};

export type UserDashboardVideoAssignment = {
  id: string;
  assignedDate: string;
  dueDate: string | null;
  scheduledTime: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  notes: string | null;
  progress: number;
  video: UserDashboardVideo;
};
