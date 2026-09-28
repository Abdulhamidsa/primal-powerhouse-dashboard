import type { GenerateMealsInput } from '@/types/meal';

/**
 * Builds the only meal-generation context that may be placed in an external AI prompt.
 * Identifiers, credentials, client profile fields, and storage references are intentionally
 * not part of this shape.
 */
export function buildMealAiContext(input: GenerateMealsInput) {
  return {
    calories: input.calories,
    protein: input.protein,
    type: input.type,
    mealCount: Math.min(10, Math.max(1, input.mealCount ?? 5)),
  };
}

export function sanitizeAiText(value: string, maxLength = 1000) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, maxLength);
}
