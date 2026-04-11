import { httpClient } from '@/lib/http/client';
import type { GenerateMealsInput, GeneratedMeal } from '@/types/meal';

export async function generateMealsApi(input: GenerateMealsInput): Promise<GeneratedMeal[]> {
  const res = await httpClient.post<{ success: boolean; data: GeneratedMeal[]; message?: string }>(
    '/api/mealsAI/generate',
    input,
  );

  if (!res) throw new Error('No response from generator API');
  if (!res.success) throw new Error(res.message ?? 'Meal generation failed');

  return res.data ?? [];
}

const mealGeneratorApi = { generate: generateMealsApi };

export default mealGeneratorApi;
