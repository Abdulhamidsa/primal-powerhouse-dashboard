import { httpClient } from '@/lib/http/client';
import type {
  BuilderMealType,
  FoodOrigin,
  GenerateMealTemplateApiResponse,
  GeneratedMealTemplate,
  RematchMealIngredientsResponse,
} from '@/features/meals/types/mealTemplateGeneration.types';
import type { UnmatchedIngredientInput } from '@/types/meal';

export async function generateMealTemplateApi(
  mealType: BuilderMealType,
  options?: {
    avoidCoreDishReferences?: string[];
    avoidMealNames?: string[];
    strictMatchMode?: 'strict' | 'lenient';
    foodOrigin?: FoodOrigin;
  },
): Promise<GeneratedMealTemplate> {
  const res = await httpClient.post<GenerateMealTemplateApiResponse>('/api/mealsAI/generate-meal-template', {
    mealType,
    strictMatchMode: options?.strictMatchMode ?? 'strict',
    foodOrigin: options?.foodOrigin,
    avoidCoreDishReferences: options?.avoidCoreDishReferences,
    avoidMealNames: options?.avoidMealNames,
  });

  if (!res) {
    throw new Error('No response from meal template generation API');
  }

  if (!res.success || !res.data) {
    throw new Error(res.message ?? 'Meal template generation failed');
  }

  return res.data;
}

export async function rematchMealIngredientsApi(
  unmatchedIngredients: UnmatchedIngredientInput[],
): Promise<RematchMealIngredientsResponse> {
  return httpClient.post<RematchMealIngredientsResponse>('/api/mealsAI/rematch-ingredients', {
    unmatchedIngredients,
  });
}

const mealTemplateGenerationApi = {
  generateMealTemplate: generateMealTemplateApi,
  rematchMealIngredients: rematchMealIngredientsApi,
};

export default mealTemplateGenerationApi;
