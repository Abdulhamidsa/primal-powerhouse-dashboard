export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: string;
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  activityLevel?: string;
  goals?: string[];
  dietaryRestrictions?: string[];
  age?: number;
  allergies?: string[];
  preferences?: string[];
  joinDate: Date;
  lastActive?: Date;
  status: string;
  notes?: string;
  sessionsCompleted?: number;
  goalCalories?: number;
  goalMacros?: string; // JSON string: {protein, carbs, fat}
  createdAt: Date;
  updatedAt: Date;
}

export interface MealAssignment {
  id: string;
  mealId: string;
  mealPlanId?: string;
  clientId: string;
  assignedDate: Date;
  dueDate?: Date;
  status: string;
  notes?: string;
  dayOfWeek?: number;
  mealType?: string;
  portion?: number;
  meal: {
    id: string;
    name: string;
    type: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    description?: string;
  };
  side?: {
    id: string;
    name: string;
    type: 'SALAD' | 'SOUP';
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number | null;
    ingredients: string[];
    spices: string[];
    instructions: string[];
    foodOrigin?: string | null;
  } | null;
}

export interface ActiveMealPlanSummary {
  id: string;
  clientId: string;
  name: string;
  updatedAt: string;
}

export type TabKey = 'overview' | 'videos' | 'meals' | 'progress' | 'client-health';
