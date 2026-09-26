import { foodsDatabase } from './foods-database';
import { recipeTemplates } from './recipe-templates';
import { scaleRecipe } from './recipe-scaling';
import { FoodSelection, MacroTarget } from './types';

/**
 * Example usage of the recipe scaling system
 */

// Get a sample recipe template - Chicken Rice Bowl
const chickenRiceBowl = recipeTemplates.find(recipe => recipe.id === 'chicken-rice-bowl')!;

// Define several different macro targets for different clients
const clientMacroTargets: { clientName: string; macroTarget: MacroTarget }[] = [
  {
    clientName: 'Athletic Client (High Protein)',
    macroTarget: {
      protein: 40,
      carbs: 50,
      fat: 15,
      tolerance: 0.1, // 10% tolerance
    },
  },
  {
    clientName: 'Weight Loss Client (Moderate Carb)',
    macroTarget: {
      protein: 35,
      carbs: 30,
      fat: 12,
      tolerance: 0.1,
    },
  },
  {
    clientName: 'Low Carb Client',
    macroTarget: {
      protein: 35,
      carbs: 20,
      fat: 25,
      tolerance: 0.1,
    },
  },
];

// Let's create food selections for each client - showing variation
const clientFoodSelections: { clientName: string; foodSelections: FoodSelection[] }[] = [
  {
    clientName: 'Athletic Client (High Protein)',
    foodSelections: [
      { anchorId: 'protein-source', foodId: 'chicken-breast' },
      { anchorId: 'carb-source', foodId: 'white-rice' },
      { anchorId: 'vegetable-1', foodId: 'broccoli' },
      { anchorId: 'vegetable-2', foodId: 'bell-pepper' },
      { anchorId: 'healthy-fat', foodId: 'olive-oil' },
    ],
  },
  {
    clientName: 'Weight Loss Client (Moderate Carb)',
    foodSelections: [
      { anchorId: 'protein-source', foodId: 'salmon' },
      { anchorId: 'carb-source', foodId: 'brown-rice' },
      { anchorId: 'vegetable-1', foodId: 'spinach' },
      { anchorId: 'vegetable-2', foodId: 'broccoli' },
      { anchorId: 'healthy-fat', foodId: 'avocado' },
    ],
  },
  {
    clientName: 'Low Carb Client',
    foodSelections: [
      { anchorId: 'protein-source', foodId: 'beef-lean' },
      { anchorId: 'carb-source', foodId: 'quinoa' },
      { anchorId: 'vegetable-1', foodId: 'spinach' },
      { anchorId: 'vegetable-2', foodId: 'bell-pepper' },
      { anchorId: 'healthy-fat', foodId: 'almonds' },
    ],
  },
];

/**
 * Generate scaled recipes for each client
 */
export function generateClientMealPlans() {
  const results = clientMacroTargets.map((_client, _index) => {
    // Find the corresponding food selections for this client
    const selections = clientFoodSelections.find(c => c.clientName === _client.clientName)?.foodSelections || [];

    // Scale the recipe for this client
    const scaledRecipe = scaleRecipe(chickenRiceBowl, _client.macroTarget, selections, foodsDatabase);

    return {
      clientName: _client.clientName,
      scaledRecipe,
    };
  });

  return results;
}

/**
 * Format the meal plan result for display
 */
export function formatMealPlanResult(result: ReturnType<typeof generateClientMealPlans>[0]) {
  const { clientName, scaledRecipe } = result;
  const { ingredients, totalMacros, targetMacros, macroMatchAccuracy } = scaledRecipe;

  let output = `\n===== Meal Plan for ${clientName} =====\n`;
  output += `Recipe: ${scaledRecipe.recipeTemplate.name}\n`;
  output += `Macro Target: ${targetMacros.protein}g protein, ${targetMacros.carbs}g carbs, ${targetMacros.fat}g fat\n`;
  output += `Match Accuracy: ${(macroMatchAccuracy * 100).toFixed(1)}%\n\n`;

  output += 'Ingredients:\n';
  ingredients.forEach(ingredient => {
    const unit = ingredient.food.servingUnit === 'piece' ? 'pieces' : ingredient.food.servingUnit;

    output += `- ${ingredient.food.name}: ${ingredient.quantity} ${unit} `;
    output += `(P: ${ingredient.macros.protein}g, C: ${ingredient.macros.carbs}g, F: ${ingredient.macros.fat}g, ${ingredient.macros.kcal} kcal)\n`;
  });

  output += `\nTotal Macros: ${totalMacros.protein}g protein, ${totalMacros.carbs}g carbs, ${totalMacros.fat}g fat, ${totalMacros.kcal} kcal\n`;

  return output;
}

/**
 * Example usage
 */
export function runMealPlannerDemo() {
  const clientPlans = generateClientMealPlans();

  let fullOutput = '🍲 MEAL PLANNER DEMO 🍲\n';
  fullOutput += '=========================\n';

  clientPlans.forEach(plan => {
    fullOutput += formatMealPlanResult(plan);
    fullOutput += '\n---------------------------\n';
  });

  return fullOutput;
}
