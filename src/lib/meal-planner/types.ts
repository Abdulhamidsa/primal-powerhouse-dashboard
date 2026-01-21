/**
 * Core types for the meal planning system
 */

/**
 * Represents macronutrient values
 */
export interface Macros {
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  kcal: number; // calories
}

/**
 * Represents a food item in the database
 */
export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  macrosPer100g: Macros;
  servingUnit: ServingUnit;
  servingSizeGrams?: number; // For piece-based foods, how many grams is one piece
  minServingSize?: number; // Minimum serving size (e.g., 1 for eggs)
  incrementSize?: number; // How much to increment by (e.g., 1 for eggs, 5 for gram-based)
}

/**
 * Categorization of food items
 */
export enum FoodCategory {
  PROTEIN = 'protein',
  CARB = 'carb',
  FAT = 'fat',
  VEGETABLE = 'vegetable',
  FRUIT = 'fruit',
  DAIRY = 'dairy',
  CONDIMENT = 'condiment',
  SUPPLEMENT = 'supplement',
  OTHER = 'other',
}

/**
 * How a food is measured
 */
export enum ServingUnit {
  GRAM = 'g',
  PIECE = 'piece',
  TABLESPOON = 'tbsp',
  TEASPOON = 'tsp',
  CUP = 'cup',
}

/**
 * An anchor is a placeholder in a recipe for a certain type of ingredient
 * that can be filled with different options
 */
export interface Anchor {
  id: string;
  name: string;
  category: FoodCategory;
  description?: string;
  required: boolean;
  defaultFoodId?: string; // Default food choice for this anchor
  allowedFoodIds: string[]; // Allowed food choices for this anchor
  defaultQuantity?: number; // Default quantity (in grams or pieces)
  macroContribution?: MacroContribution; // How this anchor contributes to overall macros
}

/**
 * How an anchor contributes to overall macros
 */
export enum MacroContribution {
  PRIMARY_PROTEIN = 'primary_protein',
  PRIMARY_CARB = 'primary_carb',
  PRIMARY_FAT = 'primary_fat',
  SECONDARY = 'secondary',
  MINIMAL = 'minimal',
}

/**
 * A recipe template is a collection of anchor points
 */
export interface RecipeTemplate {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  anchors: Anchor[];
  tags?: string[];
  estimatedTimeMinutes?: number;
}

/**
 * The target macros for a meal
 */
export interface MacroTarget {
  protein: number;
  carbs: number;
  fat: number;
  kcal?: number; // Optional, can be calculated from P/C/F
  tolerance?: number; // Allowed deviation percentage (e.g., 0.05 for 5%)
}

/**
 * A food selection for an anchor point
 */
export interface FoodSelection {
  anchorId: string;
  foodId: string;
}

/**
 * An ingredient with a specific quantity
 */
export interface ScaledIngredient {
  food: Food;
  quantity: number; // In grams or pieces
  macros: Macros; // Total macros for this ingredient at the given quantity
}

/**
 * The complete scaled recipe with ingredients and macro totals
 */
export interface ScaledRecipe {
  recipeTemplate: RecipeTemplate;
  ingredients: ScaledIngredient[];
  totalMacros: Macros;
  targetMacros: MacroTarget;
  macroMatchAccuracy: number; // 0-1 score of how well the recipe matches the target
}
