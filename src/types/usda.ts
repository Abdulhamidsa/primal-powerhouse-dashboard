/**
 * Types for USDA FoodData Central API
 */

export interface USDANutrient {
  id?: number;
  nutrientId?: number;
  number?: string;
  name: string;
  rank?: number;
  unitName: string;
}

export interface USDAFoodNutrient {
  nutrient?: USDANutrient;
  nutrientId?: number;
  nutrientName?: string;
  unitName?: string;
  amount?: number | null;
  value?: number | null;
  foodNutrientDerivation?: any;
  meanValue?: number | null;
  min?: number | null;
  max?: number | null;
  median?: number | null;
}

export interface USDAFood {
  fdcId: string;
  description: string;
  dataType?: string;
  foodNutrients?: USDAFoodNutrient[];
  foodCategory?:
    | {
        description?: string | null;
      }
    | string
    | null;
  brandOwner?: string | null;
  ingredients?: string | null;
  labelNutrients?: {
    calories?: { value?: number | null };
    protein?: { value?: number | null };
    carbohydrates?: { value?: number | null };
    fat?: { value?: number | null };
    fiber?: { value?: number | null };
  };
  servingSize?: number | null;
  servingSizeUnit?: string | null;
  publicationDate?: string;
  [key: string]: any;
}

export interface USDASearchResult {
  fdcId: string;
  description: string;
  dataType?: string;
  scoredWords?: string[];
}

export interface NormalizedFoodItem {
  fdcId: string | number;
  name: string;
  dataType: string | null;
  category: string | null;
  brand: string | null;
  ingredientsText: string | null;
  nutrientsPer100g: {
    kcal: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
    fiber: number | null;
  };
  flags: {
    incompleteNutrition: boolean;
    caloriesEstimated: boolean;
  };
  tags: string[];
}
