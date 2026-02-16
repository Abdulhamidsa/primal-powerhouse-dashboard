/**
 * Types for Open Food Facts API
 */

export interface OpenFoodFactsProduct {
  code: string;
  name: string;
  brands?: string;
  energy_kcal_100g?: number;
  energy_100g?: number; // in kJ
  energy_value?: number;
  proteins_100g?: number;
  fat_100g?: number;
  carbohydrates_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
  salt_100g?: number;
  image_url?: string;
  image_small_url?: string;
  product_name?: string;
  generic_name?: string;
}

export interface OpenFoodFactsSearchResponse {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_count: number;
}

export interface NutritionPer100g {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  hasIncompleteData: boolean;
  dataSource?: string; // 'complete', 'partial', 'incomplete'
}

export interface NutritionForGrams {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string | null;
  dataType?: string | null;
  category?: string | null;
  ingredientsText?: string | null;
  kcalPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  fiberPer100g: number | null;
  hasIncompleteData: boolean;
  tags?: string[];
  imageUrl?: string;
}

export interface SelectedIngredient extends FoodItem {
  grams: number;
}

export interface MealBuilderState {
  name: string;
  type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  servings: number;
  tags: string[];
  imageUrl?: string;
  selectedIngredients: SelectedIngredient[];
}
