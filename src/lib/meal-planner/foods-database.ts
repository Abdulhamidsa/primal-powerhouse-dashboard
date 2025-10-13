import { Food, FoodCategory, ServingUnit } from './types';

/**
 * Sample food database with macro values per 100g
 */
export const foodsDatabase: Food[] = [
  // Proteins
  {
    id: 'chicken-breast',
    name: 'Chicken Breast',
    category: FoodCategory.PROTEIN,
    macrosPer100g: {
      protein: 31,
      carbs: 0,
      fat: 3.6,
      kcal: 165,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 5,
  },
  {
    id: 'beef-lean',
    name: 'Lean Beef',
    category: FoodCategory.PROTEIN,
    macrosPer100g: {
      protein: 26,
      carbs: 0,
      fat: 11,
      kcal: 200,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 5,
  },
  {
    id: 'salmon',
    name: 'Salmon Fillet',
    category: FoodCategory.PROTEIN,
    macrosPer100g: {
      protein: 20,
      carbs: 0,
      fat: 13,
      kcal: 208,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 5,
  },
  {
    id: 'eggs',
    name: 'Whole Eggs',
    category: FoodCategory.PROTEIN,
    macrosPer100g: {
      protein: 13,
      carbs: 1,
      fat: 11,
      kcal: 155,
    },
    servingUnit: ServingUnit.PIECE,
    servingSizeGrams: 50,
    minServingSize: 1,
    incrementSize: 1,
  },
  {
    id: 'tofu',
    name: 'Firm Tofu',
    category: FoodCategory.PROTEIN,
    macrosPer100g: {
      protein: 8,
      carbs: 2,
      fat: 4,
      kcal: 76,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 5,
  },

  // Carbs
  {
    id: 'white-rice',
    name: 'White Rice (cooked)',
    category: FoodCategory.CARB,
    macrosPer100g: {
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      kcal: 130,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 5,
  },
  {
    id: 'brown-rice',
    name: 'Brown Rice (cooked)',
    category: FoodCategory.CARB,
    macrosPer100g: {
      protein: 3.5,
      carbs: 23,
      fat: 1,
      kcal: 112,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 5,
  },
  {
    id: 'sweet-potato',
    name: 'Sweet Potato (baked)',
    category: FoodCategory.CARB,
    macrosPer100g: {
      protein: 1.6,
      carbs: 20,
      fat: 0.1,
      kcal: 86,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 5,
  },
  {
    id: 'quinoa',
    name: 'Quinoa (cooked)',
    category: FoodCategory.CARB,
    macrosPer100g: {
      protein: 4.4,
      carbs: 21.3,
      fat: 1.9,
      kcal: 120,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 5,
  },
  {
    id: 'whole-wheat-bread',
    name: 'Whole Wheat Bread',
    category: FoodCategory.CARB,
    macrosPer100g: {
      protein: 13.2,
      carbs: 43,
      fat: 3.4,
      kcal: 247,
    },
    servingUnit: ServingUnit.PIECE,
    servingSizeGrams: 30,
    minServingSize: 1,
    incrementSize: 1,
  },

  // Fats
  {
    id: 'olive-oil',
    name: 'Olive Oil',
    category: FoodCategory.FAT,
    macrosPer100g: {
      protein: 0,
      carbs: 0,
      fat: 100,
      kcal: 884,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 1,
  },
  {
    id: 'avocado',
    name: 'Avocado',
    category: FoodCategory.FAT,
    macrosPer100g: {
      protein: 2,
      carbs: 9,
      fat: 15,
      kcal: 160,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 5,
  },
  {
    id: 'almonds',
    name: 'Almonds',
    category: FoodCategory.FAT,
    macrosPer100g: {
      protein: 21,
      carbs: 22,
      fat: 49,
      kcal: 579,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 5,
  },

  // Vegetables
  {
    id: 'broccoli',
    name: 'Broccoli',
    category: FoodCategory.VEGETABLE,
    macrosPer100g: {
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      kcal: 34,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 5,
  },
  {
    id: 'spinach',
    name: 'Spinach',
    category: FoodCategory.VEGETABLE,
    macrosPer100g: {
      protein: 2.9,
      carbs: 3.6,
      fat: 0.4,
      kcal: 23,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 5,
  },
  {
    id: 'bell-pepper',
    name: 'Bell Pepper',
    category: FoodCategory.VEGETABLE,
    macrosPer100g: {
      protein: 1,
      carbs: 6,
      fat: 0.3,
      kcal: 31,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 5,
  },

  // Condiments
  {
    id: 'soy-sauce',
    name: 'Soy Sauce',
    category: FoodCategory.CONDIMENT,
    macrosPer100g: {
      protein: 8,
      carbs: 5,
      fat: 0,
      kcal: 53,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 1,
  },
  {
    id: 'sriracha',
    name: 'Sriracha Sauce',
    category: FoodCategory.CONDIMENT,
    macrosPer100g: {
      protein: 1.3,
      carbs: 16,
      fat: 1,
      kcal: 78,
    },
    servingUnit: ServingUnit.GRAM,
    incrementSize: 1,
  },
];
