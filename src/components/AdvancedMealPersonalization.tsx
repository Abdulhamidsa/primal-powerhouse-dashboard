'use client';

import React, { useState, useEffect } from 'react';
import { Meal, MealIngredient, MealInstruction } from '@/types/meal';
import { Utensils, Sunrise, Sun, Moon, Apple, Save, X } from 'lucide-react';
import IngredientSearch from './IngredientSearch';
import type { SelectedIngredient } from '@/types/openFoodFacts';

interface MealPersonalizationProps {
  meal: Meal;
  isOpen: boolean;
  clientId?: string;
  onCloseAction: () => void;
  onSaveAction: (personalizedMeal: Meal, clientId?: string) => Promise<void>;
}

export default function MealPersonalization({
  meal,
  isOpen,
  clientId,
  onCloseAction,
  onSaveAction,
}: MealPersonalizationProps) {
  // State for personalized meal data
  const [personalizedMeal, setPersonalizedMeal] = useState<Meal | null>(null);
  const [, setSelectedImage] = useState<string>('');

  const calculateNutritionFromIngredients = (ingredients: MealIngredient[]) => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;
    let hasStructuredNutrition = false;

    ingredients.forEach(ingredient => {
      const typedIngredient = ingredient as MealIngredient & {
        gramsPerUnit?: number | null;
        nutritionPer100g?: {
          caloriesKcal?: number;
          proteinG?: number;
          carbsG?: number;
          fatG?: number;
          fiberG?: number;
        };
      };

      const nutrition = typedIngredient.nutritionPer100g;
      if (!nutrition) return;

      const rawAmount = Number(ingredient.amount) || 0;
      const amountGrams =
        ingredient.unit === 'piece' && (typedIngredient.gramsPerUnit ?? 0) > 0
          ? rawAmount * Number(typedIngredient.gramsPerUnit)
          : rawAmount;

      if (amountGrams <= 0) return;

      hasStructuredNutrition = true;
      const ratio = amountGrams / 100;
      calories += (nutrition.caloriesKcal ?? 0) * ratio;
      protein += (nutrition.proteinG ?? 0) * ratio;
      carbs += (nutrition.carbsG ?? 0) * ratio;
      fat += (nutrition.fatG ?? 0) * ratio;
      fiber += (nutrition.fiberG ?? 0) * ratio;
    });

    if (!hasStructuredNutrition) return null;

    return {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
    };
  };

  const normalizeIngredient = (ingredient: unknown, index: number): MealIngredient => {
    if (ingredient && typeof ingredient === 'object') {
      const value = ingredient as Record<string, unknown>;

      const normalized: MealIngredient & {
        foodId?: string;
        gramsPerUnit?: number | null;
        displayUnitLabel?: string | null;
        nutritionPer100g?: {
          caloriesKcal?: number;
          proteinG?: number;
          carbsG?: number;
          fatG?: number;
          fiberG?: number;
        };
      } = {
        id: typeof value.id === 'string' && value.id ? value.id : `ingredient-${Date.now()}-${index}`,
        name: typeof value.name === 'string' ? value.name : '',
        amount:
          typeof value.amount === 'number'
            ? value.amount
            : typeof value.grams === 'number' && value.unit === 'piece' && typeof value.gramsPerUnit === 'number'
              ? Math.round((value.grams / value.gramsPerUnit) * 100) / 100
              : typeof value.grams === 'number'
                ? value.grams
                : 0,
        unit: typeof value.unit === 'string' ? value.unit : 'g',
        notes: typeof value.notes === 'string' ? value.notes : undefined,
      };

      if (typeof value.foodId === 'string') normalized.foodId = value.foodId;
      if (typeof value.gramsPerUnit === 'number' || value.gramsPerUnit === null) {
        normalized.gramsPerUnit = value.gramsPerUnit as number | null;
      }
      if (typeof value.displayUnitLabel === 'string' || value.displayUnitLabel === null) {
        normalized.displayUnitLabel = value.displayUnitLabel as string | null;
      }
      if (value.nutritionPer100g && typeof value.nutritionPer100g === 'object') {
        const nutrition = value.nutritionPer100g as Record<string, unknown>;
        normalized.nutritionPer100g = {
          caloriesKcal: typeof nutrition.caloriesKcal === 'number' ? nutrition.caloriesKcal : 0,
          proteinG: typeof nutrition.proteinG === 'number' ? nutrition.proteinG : 0,
          carbsG: typeof nutrition.carbsG === 'number' ? nutrition.carbsG : 0,
          fatG: typeof nutrition.fatG === 'number' ? nutrition.fatG : 0,
          fiberG: typeof nutrition.fiberG === 'number' ? nutrition.fiberG : 0,
        };
      }

      return normalized;
    }

    if (typeof ingredient === 'string') {
      return {
        id: `ingredient-${Date.now()}-${index}`,
        name: ingredient,
        amount: 0,
        unit: 'g',
      };
    }

    return {
      id: `ingredient-${Date.now()}-${index}`,
      name: '',
      amount: 0,
      unit: 'g',
    };
  };

  const addIngredientFromCatalog = (ingredient: SelectedIngredient) => {
    if (!personalizedMeal) return;

    const ingredientWithNutrition: MealIngredient & {
      foodId: string;
      gramsPerUnit?: number | null;
      displayUnitLabel?: string | null;
      nutritionPer100g: {
        caloriesKcal: number;
        proteinG: number;
        carbsG: number;
        fatG: number;
        fiberG: number;
      };
    } = {
      id: `ingredient-${Date.now()}-${ingredient.id}`,
      foodId: ingredient.id,
      name: ingredient.name,
      amount: ingredient.servingUnit === 'piece' ? 1 : ingredient.grams || 100,
      unit: ingredient.servingUnit === 'piece' ? 'piece' : 'g',
      gramsPerUnit: ingredient.gramsPerUnit ?? null,
      displayUnitLabel: ingredient.displayUnitLabel ?? null,
      nutritionPer100g: {
        caloriesKcal: ingredient.kcalPer100g ?? 0,
        proteinG: ingredient.proteinPer100g ?? 0,
        carbsG: ingredient.carbsPer100g ?? 0,
        fatG: ingredient.fatPer100g ?? 0,
        fiberG: ingredient.fiberPer100g ?? 0,
      },
    };

    const nextIngredients = [...personalizedMeal.ingredients, ingredientWithNutrition];
    updateMealProperty('ingredients', nextIngredients);
    updateMealMacros(nextIngredients);
  };

  const normalizeInstruction = (instruction: unknown, index: number): MealInstruction => {
    if (instruction && typeof instruction === 'object') {
      const value = instruction as Record<string, unknown>;
      return {
        id: typeof value.id === 'string' && value.id ? value.id : `instruction-${Date.now()}-${index}`,
        step: typeof value.step === 'number' ? value.step : index + 1,
        instruction: typeof value.instruction === 'string' ? value.instruction : '',
      };
    }

    if (typeof instruction === 'string') {
      return {
        id: `instruction-${Date.now()}-${index}`,
        step: index + 1,
        instruction,
      };
    }

    return {
      id: `instruction-${Date.now()}-${index}`,
      step: index + 1,
      instruction: '',
    };
  };

  const normalizeMeal = (sourceMeal: Meal): Meal => {
    const copy = JSON.parse(JSON.stringify(sourceMeal)) as Meal;

    return {
      ...copy,
      name: copy.name ?? '',
      description: copy.description ?? '',
      type: copy.type ?? 'breakfast',
      calories: Number(copy.calories ?? 0),
      protein: Number(copy.protein ?? 0),
      carbs: Number(copy.carbs ?? 0),
      fat: Number(copy.fat ?? 0),
      fiber: Number(copy.fiber ?? 0),
      sodium: Number(copy.sodium ?? 0),
      sugar: Number(copy.sugar ?? 0),
      cholesterol: Number(copy.cholesterol ?? 0),
      prepTime: Number(copy.prepTime ?? 0),
      cookTime: Number(copy.cookTime ?? 0),
      servings: Number(copy.servings ?? 1),
      ingredients: Array.isArray(copy.ingredients)
        ? copy.ingredients.map((ingredient, index) => normalizeIngredient(ingredient, index))
        : [],
      instructions: Array.isArray(copy.instructions)
        ? copy.instructions.map((instruction, index) => normalizeInstruction(instruction, index))
        : [],
      tags: Array.isArray(copy.tags) ? copy.tags.filter(tag => typeof tag === 'string') : [],
      images: Array.isArray(copy.images) ? copy.images.filter(image => typeof image === 'string') : [],
      equipment: Array.isArray(copy.equipment) ? copy.equipment.filter(item => typeof item === 'string') : [],
      tips: Array.isArray(copy.tips) ? copy.tips.filter(item => typeof item === 'string') : [],
      allergens: Array.isArray(copy.allergens) ? copy.allergens.filter(item => typeof item === 'string') : [],
      createdAt: copy.createdAt ? new Date(copy.createdAt) : new Date(),
      updatedAt: copy.updatedAt ? new Date(copy.updatedAt) : new Date(),
    };
  };

  // Initialize the personalized meal when the original meal changes
  useEffect(() => {
    if (meal) {
      // Normalize incoming data so all form inputs stay controlled.
      const mealClone = normalizeMeal(meal);

      // Generate a new ID for the personalized meal
      mealClone.id = `personalized-${meal.id}-${Date.now()}`;

      setPersonalizedMeal(mealClone);

      // Set the selected image if available
      if (mealClone.images && mealClone.images.length > 0) {
        setSelectedImage(mealClone.images[0]);
      }
    }
  }, [meal]);

  // Handler for saving the personalized meal
  const handleSave = async () => {
    if (personalizedMeal && meal) {
      try {
        console.log('Saving personalized meal:', personalizedMeal);
        console.log('Original meal ID:', meal.id);

        const calculatedNutrition = calculateNutritionFromIngredients(personalizedMeal.ingredients);
        const mealToSave: Meal = {
          ...personalizedMeal,
          ...(calculatedNutrition ?? {}),
        };

        // Update timestamps
        mealToSave.updatedAt = new Date();

        // Make sure all numeric values are properly converted to numbers
        mealToSave.calories = Number(mealToSave.calories);
        mealToSave.protein = Number(mealToSave.protein);
        mealToSave.carbs = Number(mealToSave.carbs);
        mealToSave.fat = Number(mealToSave.fat);
        if (mealToSave.fiber !== undefined) {
          mealToSave.fiber = Number(mealToSave.fiber);
        }
        if (mealToSave.sugar !== undefined) {
          mealToSave.sugar = Number(mealToSave.sugar);
        }
        if (mealToSave.prepTime !== undefined) {
          mealToSave.prepTime = Number(mealToSave.prepTime);
        }
        if (mealToSave.cookTime !== undefined) {
          mealToSave.cookTime = Number(mealToSave.cookTime);
        }
        mealToSave.servings = Number(mealToSave.servings);

        // Call the save callback with the personalized meal and client ID
        console.log('Calling onSaveAction with personalized meal');
        await onSaveAction(mealToSave, clientId);

        // Log successful save
        console.log('Personalized meal saved successfully');

        // Close the modal after successful save
        onCloseAction();
      } catch (error) {
        console.error('Error in handleSave:', error);
        alert(`Error saving personalized meal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.error('Cannot save: personalizedMeal or original meal is null');
    }
  };

  // Generic update handler for direct properties
  const updateMealProperty = <K extends keyof Meal>(property: K, value: Meal[K]) => {
    if (personalizedMeal) {
      setPersonalizedMeal(prev => {
        if (!prev) return prev;
        return { ...prev, [property]: value };
      });
    }
  };

  // Handler for updating an ingredient
  const updateIngredient = (index: number, field: keyof MealIngredient, value: any) => {
    if (personalizedMeal) {
      const updatedIngredients = [...personalizedMeal.ingredients];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: value,
      };

      updateMealProperty('ingredients', updatedIngredients);
      updateMealMacros(updatedIngredients);
    }
  };

  // Handler for adding a new ingredient
  // const addIngredient = () => {
  //   if (personalizedMeal) {
  //     const newIngredient: MealIngredient = {
  //       id: `ingredient-${Date.now()}`,
  //       name: '',
  //       amount: 100,
  //       unit: 'g',
  //     };

  //     const nextIngredients = [...personalizedMeal.ingredients, newIngredient];
  //     updateMealProperty('ingredients', nextIngredients);
  //     updateMealMacros(nextIngredients);
  //   }
  // };

  // Handler for updating an instruction
  const updateInstruction = (index: number, field: keyof MealInstruction, value: any) => {
    if (personalizedMeal) {
      const updatedInstructions = [...personalizedMeal.instructions];
      updatedInstructions[index] = {
        ...updatedInstructions[index],
        [field]: field === 'step' ? parseInt(value) : value,
      };
      updateMealProperty('instructions', updatedInstructions);
    }
  };

  // Handler for deleting an instruction
  const deleteInstruction = (index: number) => {
    if (personalizedMeal) {
      const updatedInstructions = [...personalizedMeal.instructions];
      updatedInstructions.splice(index, 1);

      // Update step numbers
      updatedInstructions.forEach((instruction, idx) => {
        instruction.step = idx + 1;
      });

      updateMealProperty('instructions', updatedInstructions);
    }
  };

  // Handler for adding a new instruction
  const addInstruction = () => {
    if (personalizedMeal) {
      const newStep = personalizedMeal.instructions.length + 1;
      const newInstruction: MealInstruction = {
        id: `instruction-${Date.now()}`,
        step: newStep,
        instruction: '',
      };

      updateMealProperty('instructions', [...personalizedMeal.instructions, newInstruction]);
    }
  };

  // Update all macros based on ingredients
  const updateMealMacros = (ingredientsOverride?: MealIngredient[]) => {
    if (!personalizedMeal) return;

    const ingredients = ingredientsOverride ?? personalizedMeal.ingredients;
    const calculatedNutrition = calculateNutritionFromIngredients(ingredients);
    if (!calculatedNutrition) return;

    setPersonalizedMeal(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        ...calculatedNutrition,
      };
    });
  };

  // Icon for meal type
  const getMealTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return <Sunrise className="h-6 w-6" />;
      case 'lunch':
        return <Sun className="h-6 w-6" />;
      case 'dinner':
        return <Moon className="h-6 w-6" />;
      case 'snack':
        return <Apple className="h-6 w-6" />;
      default:
        return <Utensils className="h-6 w-6" />;
    }
  };

  if (!personalizedMeal) return null;

  const servingsNumber = Math.max(1, Number(personalizedMeal.servings) || 1);
  const perServing = {
    calories: Math.round((Number(personalizedMeal.calories) || 0) / servingsNumber),
    protein: Math.round(((Number(personalizedMeal.protein) || 0) / servingsNumber) * 10) / 10,
    carbs: Math.round(((Number(personalizedMeal.carbs) || 0) / servingsNumber) * 10) / 10,
    fat: Math.round(((Number(personalizedMeal.fat) || 0) / servingsNumber) * 10) / 10,
    fiber: Math.round(((Number(personalizedMeal.fiber) || 0) / servingsNumber) * 10) / 10,
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-start overflow-y-auto ${
        isOpen ? 'block' : 'hidden'
      }`}
      onClick={e => {
        if (e.target === e.currentTarget) onCloseAction();
      }}
    >
      <div
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl m-4 w-full max-w-6xl max-h-[calc(100vh-2rem)] overflow-y-auto"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex justify-between items-center p-4 border-b"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2 className="text-xl font-bold flex items-center gap-2">
            {getMealTypeIcon(personalizedMeal.type)}
            Personalize Meal
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={onCloseAction}
              className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div
            className="sticky top-16 z-10 rounded-xl border p-3 mb-6 backdrop-blur"
            style={{
              borderColor: 'var(--color-border)',
              background: 'color-mix(in srgb, var(--color-surface) 92%, transparent)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                Live Totals
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Per serving (servings: {servingsNumber})
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <div className="rounded-lg p-2 text-center" style={{ background: 'var(--color-bg-alt)' }}>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  kcal
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {personalizedMeal.calories}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {perServing.calories}/serv
                </p>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: 'var(--color-bg-alt)' }}>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Protein
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {personalizedMeal.protein}g
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {perServing.protein}g/serv
                </p>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: 'var(--color-bg-alt)' }}>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Carbs
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {personalizedMeal.carbs}g
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {perServing.carbs}g/serv
                </p>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: 'var(--color-bg-alt)' }}>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Fat
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {personalizedMeal.fat}g
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {perServing.fat}g/serv
                </p>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: 'var(--color-bg-alt)' }}>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Fiber
                </p>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {personalizedMeal.fiber}g
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {perServing.fiber}g/serv
                </p>
              </div>
            </div>
          </div>

          {/* Name and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Meal Name</label>
              <input
                type="text"
                value={personalizedMeal.name}
                readOnly
                className="w-full p-2 border rounded"
                style={{
                  background: 'var(--color-bg-alt)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Meal Type</label>
              <select
                value={personalizedMeal.type}
                disabled
                className="w-full p-2 border rounded"
                style={{
                  background: 'var(--color-bg-alt)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={personalizedMeal.description}
              readOnly
              rows={3}
              className="w-full p-2 border rounded"
              style={{
                background: 'var(--color-bg-alt)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* Time and Servings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Prep Time (minutes)</label>
              <input
                type="number"
                min="0"
                value={personalizedMeal.prepTime}
                readOnly
                className="w-full p-2 border rounded"
                style={{
                  background: 'var(--color-bg-alt)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cook Time (minutes)</label>
              <input
                type="number"
                min="0"
                value={personalizedMeal.cookTime}
                readOnly
                className="w-full p-2 border rounded"
                style={{
                  background: 'var(--color-bg-alt)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Servings</label>
              <input
                type="number"
                min="1"
                value={personalizedMeal.servings}
                readOnly
                className="w-full p-2 border rounded"
                style={{
                  background: 'var(--color-bg-alt)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
          </div>

          {/* Macros */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Nutrition Information</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Calories</label>
                <input
                  type="number"
                  min="0"
                  value={personalizedMeal.calories}
                  readOnly
                  className="w-full p-2 border rounded"
                  style={{
                    background: 'var(--color-bg-alt)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Protein (g)</label>
                <input
                  type="number"
                  min="0"
                  value={personalizedMeal.protein}
                  readOnly
                  className="w-full p-2 border rounded"
                  style={{
                    background: 'var(--color-bg-alt)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Carbs (g)</label>
                <input
                  type="number"
                  min="0"
                  value={personalizedMeal.carbs}
                  readOnly
                  className="w-full p-2 border rounded"
                  style={{
                    background: 'var(--color-bg-alt)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fat (g)</label>
                <input
                  type="number"
                  min="0"
                  value={personalizedMeal.fat}
                  readOnly
                  className="w-full p-2 border rounded"
                  style={{
                    background: 'var(--color-bg-alt)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fiber (g)</label>
                <input
                  type="number"
                  min="0"
                  value={personalizedMeal.fiber}
                  readOnly
                  className="w-full p-2 border rounded"
                  style={{
                    background: 'var(--color-bg-alt)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sugar (g)</label>
                <input
                  type="number"
                  min="0"
                  value={personalizedMeal.sugar}
                  readOnly
                  className="w-full p-2 border rounded"
                  style={{
                    background: 'var(--color-bg-alt)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Ingredients</h3>
            </div>

            <div className="mb-4 rounded-lg border p-4" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Add new ingredients from your database. This only updates this personalized meal.
              </p>
              <IngredientSearch
                onAddIngredientAction={addIngredientFromCatalog}
                selectedIds={
                  new Set(
                    personalizedMeal.ingredients
                      .map(ingredient => {
                        const typed = ingredient as MealIngredient & { foodId?: string };
                        return typed.foodId;
                      })
                      .filter((foodId): foodId is string => Boolean(foodId))
                  )
                }
              />
            </div>

            <div className="space-y-3">
              {personalizedMeal.ingredients.map((ingredient, index) => (
                <div
                  key={ingredient.id || index}
                  className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg"
                  style={{ background: 'var(--color-bg-alt)' }}
                >
                  <div className="col-span-5 sm:col-span-6">
                    <label className="text-xs block mb-1">Name</label>
                    <input
                      type="text"
                      value={ingredient.name}
                      readOnly
                      className="w-full p-1 border rounded text-sm"
                      style={{
                        background: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-2">
                    <label className="text-xs block mb-1">Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ingredient.amount}
                      onChange={e => updateIngredient(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full p-1 border rounded text-sm"
                      style={{
                        background: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-2">
                    <label className="text-xs block mb-1">Unit</label>
                    <input
                      type="text"
                      value={ingredient.unit}
                      readOnly
                      className="w-full p-1 border rounded text-sm"
                      style={{
                        background: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 flex items-end justify-end h-full">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Measure only
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Instructions</h3>
              <button
                onClick={addInstruction}
                className="flex items-center gap-1 px-3 py-1 rounded text-sm"
                style={{
                  background: 'var(--color-accent-translucent)',
                  color: 'var(--color-accent)',
                }}
              >
                Add Step
              </button>
            </div>

            <div className="space-y-3">
              {personalizedMeal.instructions.map((instruction, index) => (
                <div
                  key={instruction.id || index}
                  className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg"
                  style={{ background: 'var(--color-bg-alt)' }}
                >
                  <div className="col-span-1">
                    <label className="text-xs block mb-1">Step</label>
                    <input
                      type="number"
                      min="1"
                      value={instruction.step}
                      onChange={e => updateInstruction(index, 'step', parseInt(e.target.value) || index + 1)}
                      className="w-full p-1 border rounded text-sm"
                      style={{
                        background: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>

                  <div className="col-span-10">
                    <label className="text-xs block mb-1">Instruction</label>
                    <textarea
                      value={instruction.instruction}
                      onChange={e => updateInstruction(index, 'instruction', e.target.value)}
                      rows={2}
                      className="w-full p-1 border rounded text-sm"
                      style={{
                        background: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => deleteInstruction(index)}
                      className="p-1 rounded hover:bg-red-500 hover:bg-opacity-10 transition-colors"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Tags</h3>
            <div>
              <input
                type="text"
                placeholder="Add tags separated by commas (e.g. healthy, high-protein, quick)"
                value={personalizedMeal.tags.join(', ')}
                readOnly
                className="w-full p-2 border rounded"
                style={{
                  background: 'var(--color-bg-alt)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {personalizedMeal.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm rounded-full border flex items-center gap-1"
                  style={{
                    background: 'var(--color-accent-translucent)',
                    color: 'var(--color-accent)',
                    borderColor: 'var(--color-accent)',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className="sticky bottom-0 z-10 mt-8 pt-4 border-t"
            style={{
              borderColor: 'var(--color-border)',
              background: 'color-mix(in srgb, var(--color-surface) 94%, transparent)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
              <p className="text-xs sm:mr-auto" style={{ color: 'var(--color-text-muted)' }}>
                Changes are saved only when you click Save Personalized Meal.
              </p>
              <button
                onClick={onCloseAction}
                className="px-4 py-2 rounded-lg w-full sm:w-auto"
                style={{
                  background: 'var(--color-bg-alt)',
                  color: 'var(--color-text)',
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg w-full sm:w-auto"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-text-on-accent)',
                }}
              >
                <Save size={18} />
                Save Personalized Meal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
