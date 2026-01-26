export interface MealAssignment {
  id: string;
  mealType: string;
  dayOfWeek: number;
  portion: number;
  scheduledTime?: string;
  meal: {
    id: string;
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: string;
    instructions: string;
    category: string;
    difficulty: string;
    prepTime: number;
    cookTime: number;
    servings: number;
    tags: string;
    imageUrl?: string;
  };
  mealPlan: {
    name: string;
  };
}
export const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

export type MealsTab = 'today' | 'all';

export type MealType = (typeof MEAL_TYPES)[number];
