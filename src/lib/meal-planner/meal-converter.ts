import { Meal, MealIngredient } from '@/types/meal';
import { RecipeTemplate, Food, Macros, Anchor, FoodCategory, ServingUnit } from '@/lib/meal-planner/types';
import { foodsDatabase } from '@/lib/meal-planner/foods-database';

/**
 * Interface for ingredients with available substitutions
 */
export interface IngredientWithSubstitutions {
  originalIngredient: MealIngredient;
  substitutions: Food[];
  anchorCategory?: FoodCategory;
}

/**
 * Convert an existing meal to a recipe template for the meal planner
 */
export function convertMealToRecipeTemplate(
  meal: Meal,
  ingredientSubstitutions?: IngredientWithSubstitutions[]
): RecipeTemplate {
  // Generate unique ID for the recipe template
  const recipeId = `converted-${meal.id}`;

  // Create anchors from meal ingredients
  const anchors: Anchor[] = meal.ingredients.map((ingredient, index) => {
    // Try to find matching food in our database
    const matchingFood = findMatchingFood(ingredient);

    // Check if this ingredient has substitutions
    const ingredientWithSubs = ingredientSubstitutions?.find(item => item.originalIngredient.id === ingredient.id);

    // Get allowed food IDs from substitutions or use matching food
    let allowedFoodIds: string[] = [];
    if (ingredientWithSubs?.substitutions.length) {
      allowedFoodIds = ingredientWithSubs.substitutions.map(food => food.id);
    } else if (matchingFood) {
      allowedFoodIds = [matchingFood.id];
    }

    // If no matching food was found, create a placeholder
    if (allowedFoodIds.length === 0) {
      const placeholderId = `placeholder-${ingredient.id}`;
      // We'll need to add this to the foods database
      allowedFoodIds = [placeholderId];
    }

    // Determine anchor category
    const category = ingredientWithSubs?.anchorCategory || determineIngredientCategory(ingredient);

    return {
      id: `anchor-${ingredient.id || index}`,
      name: ingredient.name,
      description: ingredient.notes || `${ingredient.amount} ${ingredient.unit} of ${ingredient.name}`,
      required: true, // Mark all ingredients as required by default
      allowedFoodIds,
      defaultFoodId: allowedFoodIds[0],
      category,
    };
  });

  return {
    id: recipeId,
    name: meal.name,
    description: meal.description,
    anchors,
    instructions: meal.instructions
      .sort((a, b) => a.step - b.step)
      .map(instr => `${instr.step}. ${instr.instruction}`)
      .join('\n'),
    estimatedTimeMinutes: meal.prepTime + meal.cookTime,
    tags: meal.tags,
  };
}

/**
 * Find a matching food from our food database
 */
function findMatchingFood(ingredient: MealIngredient): Food | undefined {
  // First try exact name match
  const exactMatch = foodsDatabase.find(food => food.name.toLowerCase() === ingredient.name.toLowerCase());

  if (exactMatch) return exactMatch;

  // Try partial match
  const partialMatch = foodsDatabase.find(
    food =>
      food.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
      ingredient.name.toLowerCase().includes(food.name.toLowerCase())
  );

  return partialMatch;
}

/**
 * Determine the ingredient category based on its properties
 * This is a simple heuristic that can be improved
 */
function determineIngredientCategory(ingredient: MealIngredient): FoodCategory {
  const name = ingredient.name.toLowerCase();

  if (
    name.includes('chicken') ||
    name.includes('beef') ||
    name.includes('fish') ||
    name.includes('pork') ||
    name.includes('tofu') ||
    name.includes('protein') ||
    name.includes('turkey') ||
    name.includes('egg')
  ) {
    return FoodCategory.PROTEIN;
  }

  if (
    name.includes('rice') ||
    name.includes('pasta') ||
    name.includes('potato') ||
    name.includes('bread') ||
    name.includes('oat') ||
    name.includes('quinoa') ||
    name.includes('flour')
  ) {
    return FoodCategory.CARB;
  }

  if (
    name.includes('broccoli') ||
    name.includes('spinach') ||
    name.includes('carrot') ||
    name.includes('lettuce') ||
    name.includes('tomato') ||
    name.includes('cucumber') ||
    name.includes('pepper') ||
    name.includes('onion') ||
    name.includes('garlic') ||
    name.includes('vegetable')
  ) {
    return FoodCategory.VEGETABLE;
  }

  if (
    name.includes('oil') ||
    name.includes('butter') ||
    name.includes('avocado') ||
    name.includes('nuts') ||
    name.includes('cream') ||
    name.includes('cheese')
  ) {
    return FoodCategory.FAT;
  }

  return FoodCategory.OTHER;
}

/**
 * Create food objects from meal ingredients
 * Useful for adding custom foods to the database
 */
export function createFoodFromIngredient(ingredient: MealIngredient, macros: Macros): Food {
  return {
    id: `food-${ingredient.id}`,
    name: ingredient.name,
    category: determineIngredientCategory(ingredient),
    macrosPer100g: macros,
    servingUnit: ServingUnit.GRAM,
    servingSizeGrams: ingredient.amount || 100,
  };
}

/**
 * Update a meal plan with personalized scaled recipes
 */
export function personalizeClientMealPlan(meal: Meal, targetMacros: Macros) {
  // 1. Convert the meal to a recipe template
  const recipeTemplate = convertMealToRecipeTemplate(meal);

  // 2. Use our scaling system to generate a personalized version
  // Implementation depends on how you want to integrate with your existing system

  return {
    originalMeal: meal,
    recipeTemplate,
    targetMacros,
    // More implementation details here
  };
}
