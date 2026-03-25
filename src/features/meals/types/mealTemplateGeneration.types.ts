import type { MacroTotals } from '@/types/meal';

export type BuilderMealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

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
  cuisineStyle: string;
  coreDishReference: string;
  complexity: 'simple' | 'advanced';
  servings: number;
  ingredients: GeneratedTemplateIngredient[];
  instructions: string[];
  macros: MacroTotals;
  warnings: string[];
};

export type GenerateMealTemplateApiResponse = {
  success: boolean;
  data?: GeneratedMealTemplate;
  message?: string;
};
