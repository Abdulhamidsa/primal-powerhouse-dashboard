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
  allergies?: string[];
  preferences?: string[];
  joinDate: Date;
  lastActive?: Date;
  status: string;
  notes?: string;
  sessionsCompleted?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealAssignment {
  id: string;
  mealId: string;
  clientId: string;
  assignedDate: Date;
  dueDate?: Date;
  status: string;
  notes?: string;
  meal: {
    id: string;
    name: string;
    type: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    description?: string;
  };
}

export type TabKey = 'overview' | 'videos' | 'meals' | 'progress';
