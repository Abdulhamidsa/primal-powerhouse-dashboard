import { httpClient } from '@/lib/http/client';
import type {
  BuilderMealType,
  GenerateMealTemplateOptions,
  GenerateMealTemplateApiResponse,
  GeneratedMealTemplate,
  MainProteinOptionsApiResponse,
  ProteinSelectableMealType,
  MainProteinOption,
  RematchMealIngredientsResponse,
} from '@/features/meals/types/mealTemplateGeneration.types';
import type { UnmatchedIngredientInput } from '@/types/meal';

export async function generateMealTemplateApi(
  mealType: BuilderMealType,
  options?: GenerateMealTemplateOptions,
): Promise<GeneratedMealTemplate> {
  const res = await httpClient.post<GenerateMealTemplateApiResponse>('/api/mealsAI/generate-meal-template', {
    mealType,
    strictMatchMode: options?.strictMatchMode ?? 'strict',
    foodOrigin: options?.foodOrigin,
    preferredProtein: options?.preferredProtein,
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

export async function fetchMainProteinOptionsApi(mealType: ProteinSelectableMealType): Promise<MainProteinOption[]> {
  const res = await httpClient.get<MainProteinOptionsApiResponse>(
    `/api/mealsAI/protein-options?mealType=${encodeURIComponent(mealType)}`,
  );

  if (!res) {
    throw new Error('No response from protein options API');
  }

  if (!res.success || !res.data) {
    throw new Error(res.message ?? 'Failed to fetch protein options');
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
  fetchMainProteinOptions: fetchMainProteinOptionsApi,
  rematchMealIngredients: rematchMealIngredientsApi,
};

export default mealTemplateGenerationApi;
