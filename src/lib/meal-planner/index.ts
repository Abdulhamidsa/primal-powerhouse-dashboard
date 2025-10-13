/**
 * Meal Planner System - Main exports
 */

// Core Types
export * from './types';

// Data
export { foodsDatabase } from './foods-database';
export { recipeTemplates } from './recipe-templates';

// Functions
export {
  calculateMacrosForQuantity,
  roundToKitchenFriendlyUnits,
  calculateTotalMacros,
  findFoodById,
  calculateMacroMatchAccuracy,
  scaleRecipe,
} from './recipe-scaling';

// Demo
export { generateClientMealPlans, formatMealPlanResult, runMealPlannerDemo } from './meal-planner-demo';

// Meal Conversion Utilities
export { convertMealToRecipeTemplate, createFoodFromIngredient, personalizeClientMealPlan } from './meal-converter';
