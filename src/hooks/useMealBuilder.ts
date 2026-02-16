/**
 * Hook for managing Meal Builder state and calculations
 */

import { useState, useCallback } from 'react';
import type { MealBuilderState, SelectedIngredient, NutritionForGrams } from '@/types/openFoodFacts';
import { calculateTotalNutrition, calculatePerServing } from '@/utils/nutritionCalculations';

export function useMealBuilder() {
  const [state, setState] = useState<MealBuilderState>({
    name: '',
    type: 'BREAKFAST',
    servings: 1,
    tags: [],
    selectedIngredients: [],
  });

  // Update meal meta info
  const updateMealMeta = useCallback((updates: Partial<Omit<MealBuilderState, 'selectedIngredients'>>) => {
    setState(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Add ingredient
  const addIngredient = useCallback((ingredient: SelectedIngredient) => {
    setState(prev => ({
      ...prev,
      selectedIngredients: [...prev.selectedIngredients, ingredient],
    }));
  }, []);

  // Remove ingredient by id
  const removeIngredient = useCallback((ingredientId: string) => {
    setState(prev => ({
      ...prev,
      selectedIngredients: prev.selectedIngredients.filter(ing => ing.id !== ingredientId),
    }));
  }, []);

  // Update ingredient grams
  const updateIngredientGrams = useCallback((ingredientId: string, grams: number) => {
    setState(prev => ({
      ...prev,
      selectedIngredients: prev.selectedIngredients.map(ing =>
        ing.id === ingredientId ? { ...ing, grams: Math.max(1, grams) } : ing
      ),
    }));
  }, []);

  // Calculate total nutrition
  const calculateTotals = useCallback((): NutritionForGrams => {
    if (state.selectedIngredients.length === 0) {
      return { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    }

    return calculateTotalNutrition(state.selectedIngredients);
  }, [state.selectedIngredients]);

  // Calculate per-serving nutrition
  const calculatePerServingNutrition = useCallback((): NutritionForGrams => {
    const totals = calculateTotals();
    return calculatePerServing(totals, state.servings);
  }, [state.servings, calculateTotals]);

  // Reset form
  const resetForm = useCallback(() => {
    setState({
      name: '',
      type: 'BREAKFAST',
      servings: 1,
      tags: [],
      selectedIngredients: [],
    });
  }, []);

  return {
    state,
    setState,
    updateMealMeta,
    addIngredient,
    removeIngredient,
    updateIngredientGrams,
    calculateTotals,
    calculatePerServingNutrition,
    resetForm,
  };
}
