import type { MacroTotals } from '@/types/meal';
import type { UnmatchedIngredientInput } from '@/types/meal';

export type BuilderMealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
export type ProteinSelectableMealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';
export type FoodOrigin =
  | 'Syrian'
  | 'Middle Eastern'
  | 'Western'
  | 'Greek'
  | 'Mediterranean'
  | 'Mexican'
  | 'Italian'
  | 'Asian'
  | 'Indian'
  | 'Japanese'
  | 'Korean'
  | 'Thai'
  | 'Turkish';

export type GeneratedTemplateIngredient = {
  id: string;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  grams: number;
  servingUnit?: 'g' | 'piece';
  gramsPerUnit?: number | null;
  displayUnitLabel?: string | null;
};

export type GeneratedMealTemplate = {
  mealName: string;
  type: BuilderMealType;
  cuisineStyle: FoodOrigin;
  coreDishReference: string;
  cookingMethod?: string;
  complexity: 'simple' | 'advanced';
  servings: number;
  ingredients: GeneratedTemplateIngredient[];
  spices: string[];
  instructions: string[];
  macros: MacroTotals;
  warnings: string[];
  unmatchedIngredients?: UnmatchedIngredientInput[];
};

export type RematchMealIngredientsResponse = {
  matchedIngredients: GeneratedTemplateIngredient[];
  unmatchedIngredients: UnmatchedIngredientInput[];
  warnings: string[];
};

export type GenerateMealTemplateApiResponse = {
  success: boolean;
  data?: GeneratedMealTemplate;
  message?: string;
};

export type GenerateMealTemplateOptions = {
  avoidCoreDishReferences?: string[];
  avoidMealNames?: string[];
  avoidCuisines?: string[];
  avoidCookingMethods?: string[];
  strictMatchMode?: 'strict' | 'lenient';
  foodOrigin?: FoodOrigin;
  preferredProtein?: string;
};

export type MainProteinOption = {
  key: string;
  label: string;
  count: number;
  sampleName: string;
  maxProteinPer100g: number;
};

export type MainProteinOptionsApiResponse = {
  success: boolean;
  data?: MainProteinOption[];
  message?: string;
};
