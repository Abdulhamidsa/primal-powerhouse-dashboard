import { Meal, MealIngredient, MealInstruction } from "@/types/meal";

// Utility functions to convert between complex and simple meal formats
export const convertMealToSimple = (meal: Meal) => {
  return {
    ...meal,
    ingredients: meal.ingredients.map((ing) => `${ing.amount} ${ing.unit} ${ing.name}`),
    instructions: meal.instructions.map((inst) => inst.instruction),
    imageUrl: meal.images[0] || "",
  };
};

export const convertSimpleToMeal = (simpleMeal: any): Meal => {
  return {
    ...simpleMeal,
    description: simpleMeal.description || "",
    sodium: simpleMeal.sodium || 0,
    sugar: simpleMeal.sugar || 0,
    cholesterol: simpleMeal.cholesterol || 0,
    ingredients: simpleMeal.ingredients.map(
      (ing: string, index: number): MealIngredient => ({
        id: `ing-${index + 1}`,
        name: ing.split(" ").slice(1).join(" ") || ing,
        amount: 1,
        unit: "piece",
        notes: "",
      })
    ),
    instructions: simpleMeal.instructions.map(
      (inst: string, index: number): MealInstruction => ({
        id: `inst-${index + 1}`,
        step: index + 1,
        instruction: inst,
        timeEstimate: 5,
      })
    ),
    images: [simpleMeal.imageUrl || ""],
    difficulty: "easy" as "easy" | "medium" | "hard",
    equipment: [],
    tips: [],
    allergens: [],
  };
};

// Simple meal interface for backward compatibility
export interface SimpleMeal {
  id: string;
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
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
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
