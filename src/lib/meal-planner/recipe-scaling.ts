import {
  RecipeTemplate,
  MacroTarget,
  FoodSelection,
  Food,
  ScaledRecipe,
  ScaledIngredient,
  Macros,
  MacroContribution,
  ServingUnit,
} from './types';

/**
 * Calculate macros for a specific quantity of food
 */
export function calculateMacrosForQuantity(food: Food, quantity: number): Macros {
  const quantityInGrams =
    food.servingUnit === ServingUnit.PIECE && food.servingSizeGrams ? quantity * food.servingSizeGrams : quantity;

  const factor = quantityInGrams / 100;

  return {
    protein: Math.round(food.macrosPer100g.protein * factor * 10) / 10,
    carbs: Math.round(food.macrosPer100g.carbs * factor * 10) / 10,
    fat: Math.round(food.macrosPer100g.fat * factor * 10) / 10,
    kcal: Math.round(food.macrosPer100g.kcal * factor),
  };
}

/**
 * Round quantity to kitchen-friendly units
 */
export function roundToKitchenFriendlyUnits(food: Food, quantity: number): number {
  if (food.servingUnit === ServingUnit.PIECE) {
    return Math.max(Math.round(quantity), food.minServingSize || 1);
  }

  const incrementSize = food.incrementSize || 5;
  return Math.max(Math.round(quantity / incrementSize) * incrementSize, incrementSize);
}

/**
 * Get total macros from a list of scaled ingredients
 */
export function calculateTotalMacros(ingredients: ScaledIngredient[]): Macros {
  const initialMacros: Macros = { protein: 0, carbs: 0, fat: 0, kcal: 0 };

  return ingredients.reduce((total, ingredient) => {
    return {
      protein: Math.round((total.protein + ingredient.macros.protein) * 10) / 10,
      carbs: Math.round((total.carbs + ingredient.macros.carbs) * 10) / 10,
      fat: Math.round((total.fat + ingredient.macros.fat) * 10) / 10,
      kcal: Math.round(total.kcal + ingredient.macros.kcal),
    };
  }, initialMacros);
}

/**
 * Find a food by ID from the database
 */
export function findFoodById(foodId: string, foodsDb: Food[]): Food | undefined {
  return foodsDb.find(food => food.id === foodId);
}

/**
 * Calculate macro match accuracy between target and actual macros
 */
export function calculateMacroMatchAccuracy(target: MacroTarget, actual: Macros): number {
  const proteinAccuracy = Math.min(actual.protein / target.protein, 1);
  const carbsAccuracy = Math.min(actual.carbs / target.carbs, 1);
  const fatAccuracy = Math.min(actual.fat / target.fat, 1);

  // Weight the protein accuracy a bit higher
  return proteinAccuracy * 0.4 + carbsAccuracy * 0.3 + fatAccuracy * 0.3;
}

/**
 * Scale an individual ingredient to help meet the target macros
 */
export function scaleIngredientForTarget(
  food: Food,
  baseQuantity: number,
  macroContribution: MacroContribution,
  remainingTarget: MacroTarget,
  _currentTotalMacros: Macros
): number {
  let scaleFactor = 1;

  // Scale primary macro sources to their respective targets
  switch (macroContribution) {
    case MacroContribution.PRIMARY_PROTEIN:
      // Calculate how much of this food is needed to hit the protein target
      const proteinPer100g = food.macrosPer100g.protein;
      const proteinNeeded = Math.max(0, remainingTarget.protein);
      scaleFactor = ((proteinNeeded / proteinPer100g) * 100) / baseQuantity;
      break;

    case MacroContribution.PRIMARY_CARB:
      // Calculate how much of this food is needed to hit the carb target
      const carbsPer100g = food.macrosPer100g.carbs;
      const carbsNeeded = Math.max(0, remainingTarget.carbs);
      scaleFactor = ((carbsNeeded / carbsPer100g) * 100) / baseQuantity;
      break;

    case MacroContribution.PRIMARY_FAT:
      // Calculate how much of this food is needed to hit the fat target
      const fatPer100g = food.macrosPer100g.fat;
      const fatNeeded = Math.max(0, remainingTarget.fat);
      scaleFactor = ((fatNeeded / fatPer100g) * 100) / baseQuantity;
      break;

    // For secondary or minimal contributions, keep them at baseQuantity or slightly adjust
    case MacroContribution.SECONDARY:
      scaleFactor = 1;
      break;

    case MacroContribution.MINIMAL:
      scaleFactor = 1;
      break;
  }

  // Ensure scale factor is reasonable - don't scale too dramatically
  scaleFactor = Math.max(0.5, Math.min(2, scaleFactor));

  // Apply scale factor and round
  let scaledQuantity = baseQuantity * scaleFactor;

  // Round to kitchen-friendly units
  return roundToKitchenFriendlyUnits(food, scaledQuantity);
}

/**
 * Main function to scale a recipe to meet macro targets
 */
export function scaleRecipe(
  recipeTemplate: RecipeTemplate,
  macroTarget: MacroTarget,
  foodSelections: FoodSelection[],
  foodsDb: Food[]
): ScaledRecipe {
  // Initialize with default selections for any missing anchor points
  const selections = recipeTemplate.anchors.map(anchor => {
    const existingSelection = foodSelections.find(s => s.anchorId === anchor.id);
    return {
      anchorId: anchor.id,
      foodId: existingSelection?.foodId || anchor.defaultFoodId || anchor.allowedFoodIds[0],
    };
  });

  // Create initial scaled ingredients with default quantities
  const initialIngredients: ScaledIngredient[] = [];

  // First pass: Add all ingredients at their default quantities
  for (const anchor of recipeTemplate.anchors) {
    const selection = selections.find(s => s.anchorId === anchor.id);
    if (!selection) continue;

    const food = findFoodById(selection.foodId, foodsDb);
    if (!food) continue;

    const defaultQuantity = anchor.defaultQuantity || 0;
    const macros = calculateMacrosForQuantity(food, defaultQuantity);

    initialIngredients.push({
      food,
      quantity: defaultQuantity,
      macros,
    });
  }

  // Calculate initial total macros
  const _initialTotalMacros = calculateTotalMacros(initialIngredients);

  // Second pass: Scale primary macro contributors to hit targets
  const scaledIngredients: ScaledIngredient[] = [];

  // Keep track of remaining macros to hit
  let remainingTarget: MacroTarget = {
    protein: macroTarget.protein,
    carbs: macroTarget.carbs,
    fat: macroTarget.fat,
  };

  // Current running total of macros
  let currentTotalMacros: Macros = {
    protein: 0,
    carbs: 0,
    fat: 0,
    kcal: 0,
  };

  // Process primary protein sources first, then carbs, then fats, then others
  const macroOrder = [
    MacroContribution.PRIMARY_PROTEIN,
    MacroContribution.PRIMARY_CARB,
    MacroContribution.PRIMARY_FAT,
    MacroContribution.SECONDARY,
    MacroContribution.MINIMAL,
  ];

  for (const contributionType of macroOrder) {
    for (const anchor of recipeTemplate.anchors) {
      // Skip if not the current contribution type we're processing
      if (anchor.macroContribution !== contributionType) continue;

      const selection = selections.find(s => s.anchorId === anchor.id);
      if (!selection) continue;

      const food = findFoodById(selection.foodId, foodsDb);
      if (!food) continue;

      const defaultQuantity = anchor.defaultQuantity || 0;

      // Scale this ingredient to help hit the target
      const scaledQuantity = scaleIngredientForTarget(
        food,
        defaultQuantity,
        anchor.macroContribution || MacroContribution.MINIMAL,
        remainingTarget,
        currentTotalMacros
      );

      const macros = calculateMacrosForQuantity(food, scaledQuantity);

      // Add to our scaled ingredients
      scaledIngredients.push({
        food,
        quantity: scaledQuantity,
        macros,
      });

      // Update running totals
      currentTotalMacros = {
        protein: Math.round((currentTotalMacros.protein + macros.protein) * 10) / 10,
        carbs: Math.round((currentTotalMacros.carbs + macros.carbs) * 10) / 10,
        fat: Math.round((currentTotalMacros.fat + macros.fat) * 10) / 10,
        kcal: Math.round(currentTotalMacros.kcal + macros.kcal),
      };

      // Update remaining target
      remainingTarget = {
        protein: Math.max(0, remainingTarget.protein - macros.protein),
        carbs: Math.max(0, remainingTarget.carbs - macros.carbs),
        fat: Math.max(0, remainingTarget.fat - macros.fat),
      };
    }
  }

  // Calculate final total macros
  const totalMacros = calculateTotalMacros(scaledIngredients);

  // Calculate match accuracy
  const macroMatchAccuracy = calculateMacroMatchAccuracy(macroTarget, totalMacros);

  return {
    recipeTemplate,
    ingredients: scaledIngredients,
    totalMacros,
    targetMacros: macroTarget,
    macroMatchAccuracy,
  };
}
