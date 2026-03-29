// hooks/useCreateMeal.ts
'use client';

import { useCallback, useState } from 'react';
import { DataService } from '@/services/dataService';
import { fetcher } from '@/lib/fetcher';
import { AddMealFormData, addMealFormSchema } from '@/app/admin/(app)/meals/schemas/meal.schema';

export type AddMealErrors = Record<string, string>;

type CloudinaryUploadResponse = {
  data: {
    url: string;
  };
};

const DEFAULT_IMAGE_URL = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500';

export const getInitialMealFormData = (): AddMealFormData => ({
  name: '',
  type: 'BREAKFAST',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  fiber: '',
  ingredients: [''],
  spices: [''],
  instructions: [''],
  prepTime: '',
  cookTime: '',
  servings: '1',
  tags: [''],
});

function validateMealForm(formData: AddMealFormData): AddMealErrors {
  const result = addMealFormSchema.safeParse(formData);

  if (result.success) return {};

  const fieldErrors = result.error.flatten().fieldErrors;

  return Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0] ?? 'Invalid field']));
}

async function uploadMealImage(file: File): Promise<string> {
  const uploadFormData = new FormData();
  uploadFormData.append('file', file);
  uploadFormData.append('folder', 'meals');

  const response = await fetcher<CloudinaryUploadResponse>('/api/cloudinary/upload', {
    method: 'POST',
    body: uploadFormData,
  });

  return response.data.url;
}

function buildMealPayload(formData: AddMealFormData, imageUrl: string) {
  return {
    name: formData.name.trim(),
    type: formData.type,
    calories: Number(formData.calories),
    protein: Number(formData.protein),
    carbs: Number(formData.carbs),
    fat: Number(formData.fat),
    fiber: Number(formData.fiber) || 0,
    ingredients: formData.ingredients.filter(item => item.trim()),
    spices: formData.spices.filter(item => item.trim()),
    instructions: formData.instructions.filter(item => item.trim()),
    prepTime: Number(formData.prepTime),
    cookTime: Number(formData.cookTime),
    servings: Number(formData.servings) || 1,
    tags: formData.tags.filter(item => item.trim()),
    imageUrl,
  };
}

export function useCreateMeal() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<AddMealErrors>({});

  const validate = useCallback((formData: AddMealFormData) => {
    const nextErrors = validateMealForm(formData);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      if (!prev[field]) return prev;

      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const createMeal = useCallback(
    async (formData: AddMealFormData, selectedImageFile: File | null) => {
      if (loading) return false;

      const isValid = validate(formData);
      if (!isValid) return false;

      setLoading(true);

      try {
        const imageUrl = selectedImageFile ? await uploadMealImage(selectedImageFile) : DEFAULT_IMAGE_URL;

        const mealData = buildMealPayload(formData, imageUrl);
        await DataService.createMeal(mealData);

        setErrors({});
        return true;
      } catch (error) {
        setErrors({
          general: `Failed to create meal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loading, validate],
  );

  return {
    loading,
    errors,
    createMeal,
    validate,
    clearFieldError,
    clearErrors,
  };
}
