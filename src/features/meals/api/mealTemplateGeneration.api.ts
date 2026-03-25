import { httpClient } from '@/lib/http/client';
import type {
  BuilderMealType,
  GenerateMealTemplateApiResponse,
  GeneratedMealTemplate,
} from '@/features/meals/types/mealTemplateGeneration.types';

export async function generateMealTemplateApi(
  mealType: BuilderMealType,
  options?: { avoidCoreDishReferences?: string[]; avoidMealNames?: string[]; strictMatchMode?: 'strict' | 'lenient' },
): Promise<GeneratedMealTemplate> {
  const res = await httpClient.post<GenerateMealTemplateApiResponse>('/api/mealsAI/generate-meal-template', {
    mealType,
    strictMatchMode: options?.strictMatchMode ?? 'strict',
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

const mealTemplateGenerationApi = { generateMealTemplate: generateMealTemplateApi };

export default mealTemplateGenerationApi;
