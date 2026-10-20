export type AdminPersonalizedMeal = {
  id: string;
  name: string;
  type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  tags: string[];
  imageUrl: string;
  isPersonalized: boolean;
  originalMealId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPersonalizedMealsResponse = {
  meals: AdminPersonalizedMeal[];
  count: number;
};
