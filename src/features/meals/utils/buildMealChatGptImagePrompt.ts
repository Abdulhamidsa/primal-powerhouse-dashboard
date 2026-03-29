import type { MealPromptInput, MealPromptOutput } from '@/features/meals/types/mealPrompt.types';

const MAX_INGREDIENTS = 12;

// Keep prompt text in one full template block so it's easy to edit in one place.
const POSITIVE_PROMPT_TEMPLATE = `Bright natural home kitchen food photography, soft daylight streaming through a kitchen window, warm and cozy cooking atmosphere.

Single plated serving of: {MEAL_NAME}.

Ingredients included in the dish: {INGREDIENTS}.

Spices and seasonings: {SPICES}.

All ingredients are cooked and presented as a finished meal.
No raw meat, no uncooked ingredients, no oversized portions.

Balanced portion sizes suitable for a healthy fitness meal.

The meal is served on a clean ceramic plate or bowl placed on a wooden kitchen counter.

Beautiful home kitchen background with soft bokeh blur:
light wooden countertop, window light, subtle kitchen items like olive oil bottle, herbs, cutting board, fresh vegetables, and a folded kitchen towel.

Background is softly blurred to keep focus on the food while still showing a warm kitchen environment.

Natural textures, realistic colors, subtle steam from warm food.

Shot like professional food photography with a 50mm lens, shallow depth of field, crisp focus on the food.

One portion only, centered composition.`;

const NEGATIVE_PROMPT_TEMPLATE = `raw meat, raw chicken, uncooked ingredients, giant food, oversized portions, multiple plates, messy table, dark background, restaurant plating, studio lighting`;

function normalizeMealName(mealName: string): string {
  return mealName.trim().replace(/\s+/g, ' ');
}

function normalizeIngredients(ingredients: string[]): string[] {
  const seen = new Set<string>();

  return ingredients
    .map(ingredient => ingredient.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .filter(ingredient => {
      const key = ingredient.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_INGREDIENTS);
}

export function buildMealChatGptImagePrompt(input: MealPromptInput): MealPromptOutput {
  const mealName = normalizeMealName(input.mealName);
  const ingredients = normalizeIngredients(input.ingredients);
  const spices = normalizeIngredients(input.spices || []);

  const ingredientLine = ingredients.length > 0 ? ingredients.join(', ') : 'fresh whole ingredients matching the meal';
  const spiceLine = spices.length > 0 ? spices.join(', ') : 'aromatic spices and seasonings';

  const positivePrompt = POSITIVE_PROMPT_TEMPLATE.replace('{MEAL_NAME}', mealName)
    .replace('{INGREDIENTS}', ingredientLine)
    .replace('{SPICES}', spiceLine);

  const negativePrompt = NEGATIVE_PROMPT_TEMPLATE;

  return {
    positivePrompt,
    negativePrompt,
    fullPrompt: `Positive Prompt:\n${positivePrompt}\n\nNegative Prompt:\n${negativePrompt}`,
  };
}
