import { Meal as MealType, MealIngredient, MealInstruction } from '@/types/meal';
import { MealListItem } from '@/lib/meal-planner/types';
// Function to convert our Meal interface to the MealType interface for the NewMealDetailModal

export const convertToMealType = (meal: MealListItem): MealType => {
  const ingredientsConverted: MealIngredient[] = meal.ingredients.map((ing, index) => {
    if (typeof ing === 'string') {
      return {
        id: `ing-${index}`,
        name: ing,
        amount: 1,
        unit: 'serving',
      };
    }

    return {
      id: ing.foodId || `ing-${index}`,
      name: ing.name || `Ingredient ${index + 1}`,
      amount: typeof ing.grams === 'number' ? ing.grams : 1,
      unit: ing.unit || 'g',
    };
  });

  const instructionsConverted: MealInstruction[] = meal.instructions.map((ins, index) => {
    if (typeof ins === 'string') {
      return {
        id: `ins-${index}`,
        step: index + 1,
        instruction: ins,
      };
    }

    return {
      id: ins.id || `ins-${index}`,
      step: typeof ins.step === 'number' ? ins.step : index + 1,
      instruction: typeof ins.instruction === 'string' ? ins.instruction : '',
    };
  });

  return {
    id: meal.id,
    name: meal.name,
    type: meal.type.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    description: '',
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    fiber: meal.fiber,
    sodium: 0,
    sugar: 0,
    cholesterol: 0,
    ingredients: ingredientsConverted,
    instructions: instructionsConverted,
    prepTime: meal.prepTime,
    cookTime: meal.cookTime,
    servings: meal.servings,
    tags: meal.tags,
    images: [meal.imageUrl],
    difficulty: 'medium',
    equipment: [],
    tips: [],
    allergens: [],
    createdAt: new Date(meal.createdAt),
    updatedAt: new Date(meal.updatedAt),
  };
};
