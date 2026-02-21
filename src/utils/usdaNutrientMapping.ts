/**
 * USDA Nutrient Mapping Utility
 * Converts USDA FoodData Central nutrients to normalized format
 */

import type { USDAFood, NormalizedFoodItem, USDAFoodNutrient } from '@/types/usda';
import { computeFoodTags } from '@/helpers/computeFoodTags';

// USDA Nutrient IDs for common macronutrients
const NUTRIENT_IDS = {
  ENERGY_KCAL: [1008], // Energy (kcal)
  ENERGY_KJ: [1062], // Energy (kJ)
  PROTEIN: [1003],
  FAT: [1004],
  CARBS: [1005],
  FIBER: [1079],
};

/**
 * Extract nutrient value from USDA food's nutrient array
 * Searches by nutrient ID and returns the meanValue
 */
function getNutrientEntry(
  foodNutrients: USDAFoodNutrient[] | undefined,
  nutrientIds: number[]
): USDAFoodNutrient | null {
  if (!foodNutrients || foodNutrients.length === 0) {
    return null;
  }

  for (const nutrientId of nutrientIds) {
    const nutrient = foodNutrients.find(fn => {
      const id = fn.nutrientId ?? fn.nutrient?.id ?? fn.nutrient?.nutrientId ?? fn.nutrient?.number ?? fn.nutrientName;
      return id === nutrientId || String(id) === String(nutrientId);
    });

    if (nutrient) {
      return nutrient;
    }
  }

  return null;
}

function getNutrientValueAndUnit(
  foodNutrients: USDAFoodNutrient[] | undefined,
  nutrientIds: number[]
): { value: number | null; unit: string | null } {
  const nutrient = getNutrientEntry(foodNutrients, nutrientIds);
  if (!nutrient) {
    return { value: null, unit: null };
  }

  const value = nutrient.amount ?? nutrient.value ?? nutrient.meanValue ?? null;
  const unit = nutrient.unitName ?? nutrient.nutrient?.unitName ?? null;

  return { value, unit };
}

/**
 * Convert kJ to kcal
 */
function kjToKcal(kj: number): number {
  return Math.round(kj / 4.184);
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeServingUnit(unit: string | null | undefined): string {
  if (!unit) {
    return '';
  }

  return unit.trim().toLowerCase();
}

function getLabelNutrientsPer100g(usdaFood: USDAFood): {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
} {
  const label = usdaFood.labelNutrients;
  if (!label) {
    return {
      kcal: null,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
    };
  }

  const servingSize = usdaFood.servingSize ?? null;
  const servingUnit = normalizeServingUnit(usdaFood.servingSizeUnit);
  const canConvert = servingSize !== null && servingSize > 0 && servingUnit === 'g';
  const factor = canConvert ? 100 / servingSize : null;

  const toPer100g = (value: number | null | undefined): number | null => {
    if (value === null || value === undefined) {
      return null;
    }

    if (!factor) {
      return null;
    }

    return roundToTwo(value * factor);
  };

  return {
    kcal: toPer100g(label.calories?.value ?? null),
    protein: toPer100g(label.protein?.value ?? null),
    carbs: toPer100g(label.carbohydrates?.value ?? null),
    fat: toPer100g(label.fat?.value ?? null),
    fiber: toPer100g(label.fiber?.value ?? null),
  };
}

/**
 * Estimate calories from macronutrients
 * kcal = (protein * 4) + (carbs * 4) + (fat * 9)
 */
function estimateCaloriesFromMacros(protein: number | null, carbs: number | null, fat: number | null): number | null {
  if (protein === null && carbs === null && fat === null) {
    return null;
  }

  const proteinCals = (protein ?? 0) * 4;
  const carbsCals = (carbs ?? 0) * 4;
  const fatCals = (fat ?? 0) * 9;

  return Math.round(proteinCals + carbsCals + fatCals);
}

/**
 * Main mapping function: Convert USDA food to normalized format
 */
export function mapUSDANutrientsToPer100g(usdaFood: USDAFood): NormalizedFoodItem {
  const { fdcId, description } = usdaFood;
  const dataType = usdaFood.dataType ?? null;
  const category =
    typeof usdaFood.foodCategory === 'string' ? usdaFood.foodCategory : (usdaFood.foodCategory?.description ?? null);
  const brand = usdaFood.brandOwner ?? null;
  const ingredientsText = usdaFood.ingredients ?? null;

  const nutrition = normalizeNutrients(usdaFood);

  const normalized: NormalizedFoodItem = {
    fdcId,
    name: description || 'Unknown',
    dataType,
    category,
    brand,
    ingredientsText,
    nutrientsPer100g: {
      kcal: nutrition.kcal,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
    },
    flags: {
      incompleteNutrition: nutrition.incompleteNutrition,
      caloriesEstimated: nutrition.caloriesEstimated,
    },
    tags: [],
  };

  normalized.tags = computeFoodTags(normalized);

  return normalized;
}

export function normalizeNutrients(usdaFood: USDAFood): {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  incompleteNutrition: boolean;
  caloriesEstimated: boolean;
} {
  const { foodNutrients } = usdaFood;

  const kcalEntry = getNutrientValueAndUnit(foodNutrients, NUTRIENT_IDS.ENERGY_KCAL);
  let kcal = kcalEntry.value;

  // Convert kJ to kcal when needed
  if (kcal !== null && kcalEntry.unit && kcalEntry.unit.toLowerCase() === 'kj') {
    kcal = kjToKcal(kcal);
  }

  if (kcal === null) {
    const kjEntry = getNutrientValueAndUnit(foodNutrients, NUTRIENT_IDS.ENERGY_KJ);
    if (kjEntry.value !== null) {
      kcal = kjToKcal(kjEntry.value);
    }
  }

  let protein = getNutrientValueAndUnit(foodNutrients, NUTRIENT_IDS.PROTEIN).value;
  let carbs = getNutrientValueAndUnit(foodNutrients, NUTRIENT_IDS.CARBS).value;
  let fat = getNutrientValueAndUnit(foodNutrients, NUTRIENT_IDS.FAT).value;
  let fiber = getNutrientValueAndUnit(foodNutrients, NUTRIENT_IDS.FIBER).value;

  const hasAnyPrimaryNutrition = kcal !== null || protein !== null || carbs !== null || fat !== null || fiber !== null;

  if (!hasAnyPrimaryNutrition) {
    const labelPer100g = getLabelNutrientsPer100g(usdaFood);
    kcal = labelPer100g.kcal;
    protein = labelPer100g.protein;
    carbs = labelPer100g.carbs;
    fat = labelPer100g.fat;
    fiber = labelPer100g.fiber;
  }

  let caloriesEstimated = false;

  if (kcal === null && (protein !== null || carbs !== null || fat !== null)) {
    kcal = estimateCaloriesFromMacros(protein, carbs, fat);
    caloriesEstimated = true;
  }

  const hasAnyNutritionData = kcal !== null || protein !== null || carbs !== null || fat !== null || fiber !== null;

  return {
    kcal,
    protein,
    carbs,
    fat,
    fiber,
    incompleteNutrition: !hasAnyNutritionData,
    caloriesEstimated,
  };
}

export function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function scoreCandidate(candidate: NormalizedFoodItem, query: string): number {
  const dataTypeWeight =
    candidate.dataType === 'Foundation'
      ? 50
      : candidate.dataType === 'SR Legacy'
        ? 40
        : candidate.dataType === 'Branded'
          ? 20
          : 0;

  const nutrientValues = [
    candidate.nutrientsPer100g.kcal,
    candidate.nutrientsPer100g.protein,
    candidate.nutrientsPer100g.carbs,
    candidate.nutrientsPer100g.fat,
    candidate.nutrientsPer100g.fiber,
  ];

  const nutrientScore =
    nutrientValues.filter(value => value !== null).length * 5 + (candidate.nutrientsPer100g.fiber !== null ? 10 : 0);

  const queryTokens = tokenize(query);
  const nameTokens = tokenize(candidate.name);
  const sharedTokenCount = queryTokens.filter(token => nameTokens.includes(token)).length;
  const allQueryTokensMatch = queryTokens.length > 0 && queryTokens.every(token => nameTokens.includes(token));

  let score = dataTypeWeight + nutrientScore + sharedTokenCount * 3;

  if (allQueryTokensMatch) {
    score += 15;
  }

  const wrongFormTerms = ['oil', 'bread', 'muffin', 'bagel'];
  const hasWrongForm = wrongFormTerms.some(term => nameTokens.includes(term));
  const queryHasWrongForm = wrongFormTerms.some(term => queryTokens.includes(term));

  if (hasWrongForm && !queryHasWrongForm) {
    score -= 30;
  }

  const cookedInName = nameTokens.includes('cooked');
  const cookedInQuery = queryTokens.includes('cooked');
  if (cookedInName && !cookedInQuery) {
    score -= 15;
  }

  return score;
}

export function pickBestCandidate(candidates: NormalizedFoodItem[], query: string): NormalizedFoodItem | null {
  const requiredMacros = candidates.filter(candidate => {
    const nutrients = candidate.nutrientsPer100g;
    return nutrients.kcal !== null && nutrients.protein !== null && nutrients.carbs !== null && nutrients.fat !== null;
  });

  if (requiredMacros.length === 0) {
    return null;
  }

  const sorted = [...requiredMacros].sort((a, b) => {
    const scoreDiff = scoreCandidate(b, query) - scoreCandidate(a, query);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    const dataTypeWeight = (candidate: NormalizedFoodItem) =>
      candidate.dataType === 'Foundation'
        ? 50
        : candidate.dataType === 'SR Legacy'
          ? 40
          : candidate.dataType === 'Branded'
            ? 20
            : 0;

    const dataTypeDiff = dataTypeWeight(b) - dataTypeWeight(a);
    if (dataTypeDiff !== 0) {
      return dataTypeDiff;
    }

    const fiberA = a.nutrientsPer100g.fiber !== null ? 1 : 0;
    const fiberB = b.nutrientsPer100g.fiber !== null ? 1 : 0;
    return fiberB - fiberA;
  });

  const best = sorted[0];
  if (best.nutrientsPer100g.fiber !== null) {
    return best;
  }

  const bestName = best.name.toLowerCase();
  const fiberFallback = sorted.find(
    candidate => candidate.name.toLowerCase() === bestName && candidate.nutrientsPer100g.fiber !== null
  );

  return fiberFallback ?? best;
}

export interface USDAFilterOptions {
  allowedCategories: string[];
  excludedNameTerms: string[];
  allowedDataTypes: Array<'Foundation' | 'SR Legacy'>;
  form?: 'raw' | 'dry' | 'cooked' | 'processed' | 'all';
}

const COOKED_TERMS = ['cooked', 'prepared', 'roasted', 'toasted', 'baked', 'fried', 'steamed', 'boiled'];

export function applyFilters(
  candidates: NormalizedFoodItem[],
  filters: USDAFilterOptions,
  query: string
): NormalizedFoodItem[] {
  const queryTokens = tokenize(query);
  const hasCookedInQuery = queryTokens.some(token => COOKED_TERMS.includes(token));
  const allowedCategoriesLower = filters.allowedCategories.map(category => category.toLowerCase());
  const excludedTerms = filters.excludedNameTerms.map(term => term.toLowerCase());

  return candidates.filter(candidate => {
    if (!filters.allowedDataTypes.includes((candidate.dataType ?? 'Foundation') as 'Foundation' | 'SR Legacy')) {
      return false;
    }

    if (candidate.brand) {
      return false;
    }

    if (!candidate.category) {
      return false;
    }

    const categoryLower = candidate.category.toLowerCase();
    const matchesCategory = allowedCategoriesLower.some(category => categoryLower.includes(category));
    if (!matchesCategory) {
      return false;
    }

    const nameTokens = tokenize(candidate.name);
    const hasExcludedTerm = excludedTerms.some(term => nameTokens.includes(term));
    if (hasExcludedTerm) {
      return false;
    }

    const hasCookedInName = COOKED_TERMS.some(term => nameTokens.includes(term));
    if (hasCookedInName && !hasCookedInQuery && filters.form !== 'cooked') {
      return false;
    }

    const nutrients = candidate.nutrientsPer100g;
    if (nutrients.kcal === null || nutrients.protein === null || nutrients.carbs === null || nutrients.fat === null) {
      return false;
    }

    if (filters.form && filters.form !== 'all') {
      const tags = candidate.tags ?? [];
      return tags.includes(filters.form);
    }

    return true;
  });
}

/**
 * Filter to keep only items with sufficient nutrition data
 * Requires: kcal AND (protein OR carbs OR fat)
 */
export function isNutritionDataSufficient(item: NormalizedFoodItem): boolean {
  const { nutrientsPer100g } = item;
  const hasKcal = nutrientsPer100g.kcal !== null;
  const hasMacros =
    nutrientsPer100g.protein !== null || nutrientsPer100g.carbs !== null || nutrientsPer100g.fat !== null;

  return hasKcal && hasMacros;
}
