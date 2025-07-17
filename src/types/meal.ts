export interface Meal {
  id: string;
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  description: string; // Detailed description of the meal
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number; // in mg
  sugar: number; // in g
  cholesterol: number; // in mg
  ingredients: MealIngredient[];
  instructions: MealInstruction[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  tags: string[];
  images: string[]; // Multiple images array
  difficulty: "easy" | "medium" | "hard";
  equipment: string[]; // Required cooking equipment
  tips: string[]; // Cooking tips and notes
  nutritionNotes?: string; // Special nutrition information
  allergens: string[]; // Common allergens
  createdAt: Date;
  updatedAt: Date;
}

export interface MealIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string; // cup, tbsp, oz, g, etc.
  notes?: string; // optional preparation notes
}

export interface MealInstruction {
  id: string;
  step: number;
  instruction: string;
  timeEstimate?: number; // time for this step in minutes
  temperature?: string; // cooking temperature if applicable
  image?: string; // step-by-step image
}

export interface MealPlan {
  id: string;
  clientId: string;
  startDate: Date;
  endDate: Date;
  meals: {
    [date: string]: DailyMealPlan;
  };
  notes?: string;
  goalCalories?: number;
  goalProtein?: number;
  dietaryRestrictions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyMealPlan {
  breakfast?: AssignedMeal;
  lunch?: AssignedMeal;
  dinner?: AssignedMeal;
  snack?: AssignedMeal;
  totalCalories: number;
  totalProtein: number;
  notes?: string;
}

export interface AssignedMeal {
  meal: Meal;
  assignedAt: Date;
  completed: boolean;
  clientNotes?: string;
  coachNotes?: string;
  rating?: number; // 1-5 star rating from client
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extremely_active";
  goals: string[]; // weight loss, muscle gain, maintenance, etc.
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
  currentMealPlan?: MealPlan;
  mealHistory: MealPlan[];
  joinDate: Date;
  lastActive?: Date;
  status: "active" | "inactive" | "paused";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
