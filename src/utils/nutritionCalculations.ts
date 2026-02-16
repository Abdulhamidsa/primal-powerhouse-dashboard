/**
 * Nutrition calculation utilities for meal builder
 */

import type { OpenFoodFactsProduct, NutritionPer100g, NutritionForGrams } from '@/types/openFoodFacts';

/**
 * Parse nutrition data from Open Food Facts product (v2 API format)
 * Now that we're filtering for complete data, we expect all values to be present
 * Treats missing/null as incomplete (not as 0)
 */
export function parseNutritionPer100g(product: OpenFoodFactsProduct | null): NutritionPer100g {
  if (!product) {
    return {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      hasIncompleteData: true,
      dataSource: 'incomplete',
    };
  }

  // v2 API wraps nutrition in nutriments object with hyphenated field names
  // Front-end now enforces complete data, but still guard against nulls
  const nutriments = (product as any).nutriments || {};

  // Use hyphen version (v2 standard) or underscore fallback
  // If truly missing/null, mark as incomplete (don't use 0)
  const kcal = nutriments['energy-kcal_100g'] ?? nutriments.energy_kcal_100g ?? 0;
  const protein = nutriments.proteins_100g ?? 0;
  const carbs = nutriments.carbohydrates_100g ?? 0;
  const fat = nutriments.fat_100g ?? 0;
  const fiber = nutriments.fiber_100g ?? 0;

  // Check if we have incomplete data
  const hasData = kcal > 0 || protein > 0 || fat > 0 || carbs > 0;
  const hasIncompleteData = !hasData || (protein === 0 && fat === 0 && carbs === 0);

  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein * 100) / 100,
    carbs: Math.round(carbs * 100) / 100,
    fat: Math.round(fat * 100) / 100,
    fiber: Math.round(fiber * 100) / 100,
    hasIncompleteData,
    dataSource: hasIncompleteData ? 'incomplete' : 'complete',
  };
}

/**
 * Calculate nutrition for a specific amount of grams
 */
export function computeNutritionForGrams(per100g: NutritionPer100g, grams: number): NutritionForGrams {
  const multiplier = grams / 100;

  return {
    kcal: Math.round(per100g.kcal * multiplier),
    protein: Math.round(per100g.protein * multiplier * 100) / 100,
    carbs: Math.round(per100g.carbs * multiplier * 100) / 100,
    fat: Math.round(per100g.fat * multiplier * 100) / 100,
    fiber: Math.round(per100g.fiber * multiplier * 100) / 100,
  };
}

/**
 * Calculate total nutrition from multiple ingredients
 */
export function calculateTotalNutrition(
  ingredients: Array<{
    grams: number;
    kcalPer100g: number | null;
    proteinPer100g: number | null;
    carbsPer100g: number | null;
    fatPer100g: number | null;
    fiberPer100g: number | null;
  }>
): NutritionForGrams {
  const totals = {
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };

  ingredients.forEach(ing => {
    const multiplier = ing.grams / 100;
    totals.kcal += (ing.kcalPer100g ?? 0) * multiplier;
    totals.protein += (ing.proteinPer100g ?? 0) * multiplier;
    totals.carbs += (ing.carbsPer100g ?? 0) * multiplier;
    totals.fat += (ing.fatPer100g ?? 0) * multiplier;
    totals.fiber += (ing.fiberPer100g ?? 0) * multiplier;
  });

  return {
    kcal: Math.round(totals.kcal),
    protein: Math.round(totals.protein * 100) / 100,
    carbs: Math.round(totals.carbs * 100) / 100,
    fat: Math.round(totals.fat * 100) / 100,
    fiber: Math.round(totals.fiber * 100) / 100,
  };
}

/**
 * Calculate per-serving nutrition
 */
export function calculatePerServing(nutrition: NutritionForGrams, servings: number): NutritionForGrams {
  if (servings <= 0) return nutrition;

  return {
    kcal: Math.round(nutrition.kcal / servings),
    protein: Math.round((nutrition.protein / servings) * 100) / 100,
    carbs: Math.round((nutrition.carbs / servings) * 100) / 100,
    fat: Math.round((nutrition.fat / servings) * 100) / 100,
    fiber: Math.round((nutrition.fiber / servings) * 100) / 100,
  };
}
