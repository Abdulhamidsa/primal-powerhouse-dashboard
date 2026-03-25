import { httpClient } from '@/lib/http/client';
import type { GeneratedMeal } from '@/types/meal';

type SaveTemplateResponse = {
  success: boolean;
  data?: {
    id: string;
    name: string;
    type: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number | null;
  };
  message?: string;
  existingMealId?: string;
};

export async function saveGeneratedMealTemplateApi(input: {
  meal: GeneratedMeal;
  force?: boolean;
  tags?: string[];
}): Promise<SaveTemplateResponse> {
  const res = await httpClient.post<SaveTemplateResponse>('/api/mealsAI/save-template', input);

  if (!res) {
    throw new Error('No response from save template API');
  }

  return res;
}

export default {
  saveGeneratedMealTemplate: saveGeneratedMealTemplateApi,
};
