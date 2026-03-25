export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
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
  imageUrl?: string; // Single image URL from database
  difficulty: 'easy' | 'medium' | 'hard';
  equipment: string[]; // Required cooking equipment
  tips: string[]; // Cooking tips and notes
  nutritionNotes?: string; // Special nutrition information
  allergens: string[]; // Common allergens
  isPersonalized?: boolean; // Whether this meal is personalized for a client
  originalMealId?: string; // If personalized, the ID of the original meal
  clientId?: string; // If personalized, the client ID
  coachId?: string; // The coach who created this meal
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
  gender?: 'male' | 'female' | 'other';
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  goals: string[]; // weight loss, muscle gain, maintenance, etc.
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
  currentMealPlan?: MealPlan;
  mealHistory: MealPlan[];
  joinDate: Date;
  lastActive?: Date;
  status: 'active' | 'inactive' | 'paused';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealImageProvider = 'azure' | 'local-sd';
export type MealImageQualityProfile = 'fast' | 'balanced' | 'high';

export interface MealIngredientSuggestion {
  name: string;
  grams: number;
}

export interface AiMealSuggestion {
  name: string;
  ingredients: MealIngredientSuggestion[];
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MatchedIngredient {
  id: string;
  name: string;
  displayName: string | null;
  canonicalName: string | null;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  matchedInput: string;
  grams: number;
  matchScore: number;
}

export interface GeneratedMeal {
  name: string;
  type: MealType;
  ingredients: MatchedIngredient[];
  macros: MacroTotals;
  imageUrl?: string | null;
  rejectedReason?: string | null;
}

export interface GenerateMealsInput {
  calories: number;
  protein: number;
  type: MealType;
  mealCount?: number;
  generateImages?: boolean;
  imageProvider?: MealImageProvider;
  imageCheckpoint?: string;
  imageQualityProfile?: MealImageQualityProfile;
}

export interface SavedTemplateIngredientSnapshot {
  foodId: string;
  name: string;
  canonicalName?: string | null;
  matchedInput?: string;
  grams: number;
  amount: number;
  unit: 'g';
  matchScore?: number;
  nutritionPer100g: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number | null;
  };
}

export interface SaveGeneratedMealTemplateInput {
  meal: GeneratedMeal;
  force?: boolean;
  tags?: string[];
}

export interface FoodGenerationReadyRow {
  id: string;
  name: string;
  display_name: string | null;
  canonical_name: string | null;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
}
