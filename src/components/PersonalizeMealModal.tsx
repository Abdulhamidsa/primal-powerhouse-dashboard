'use client';

import React, { useState, useEffect } from 'react';
import { Meal } from '@/types/meal';
import { MacroTarget } from '@/lib/meal-planner/types';
import { convertMealToRecipeTemplate } from '@/lib/meal-planner/meal-converter';
import { scaleRecipe } from '@/lib/meal-planner/recipe-scaling';
import { foodsDatabase } from '@/lib/meal-planner/foods-database';

interface PersonalizeMealModalProps {
  meal: Meal | null;
  isOpen: boolean;
  onCloseAction: () => void;
  onSave?: (updatedMeal: Meal) => void;
}

export default function PersonalizeMealModal({ meal, isOpen, onCloseAction, onSave }: PersonalizeMealModalProps) {
  // Default macro targets based on the original meal
  const defaultMacroTarget: MacroTarget = meal
    ? {
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      }
    : { protein: 30, carbs: 40, fat: 15 };

  const [macroTarget, setMacroTarget] = useState<MacroTarget>(defaultMacroTarget);
  const [scaledRecipeResult, setScaledRecipeResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Reset macro targets when meal changes
  useEffect(() => {
    if (meal) {
      setMacroTarget({
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      });

      // Clear previous scaled recipe result
      setScaledRecipeResult(null);
    }
  }, [meal]);

  // Handle scaling the recipe
  const handleScaleMeal = () => {
    if (!meal) return;

    try {
      // Convert the meal to a recipe template
      const recipeTemplate = convertMealToRecipeTemplate(meal);

      // Create food selections from the recipe template anchors
      const foodSelections = recipeTemplate.anchors.map(anchor => ({
        anchorId: anchor.id,
        foodId: anchor.defaultFoodId || anchor.allowedFoodIds[0],
      }));

      // Scale the recipe
      const scaledRecipe = scaleRecipe(recipeTemplate, macroTarget, foodSelections, foodsDatabase);

      setScaledRecipeResult(scaledRecipe);
      setError(null);
    } catch (err) {
      setError('Error scaling recipe: ' + (err instanceof Error ? err.message : String(err)));
      console.error(err);
    }
  };

  // Handle macro target changes
  const handleMacroChange = (macro: keyof MacroTarget, value: number) => {
    setMacroTarget(prev => ({
      ...prev,
      [macro]: value,
    }));
  };

  if (!meal) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start overflow-y-auto ${isOpen ? 'block' : 'hidden'}`}
    >
      <div
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl m-4 w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto p-6"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              Personalize Meal: {meal.name}
            </h2>
            <button onClick={onCloseAction} className="p-2 rounded-full hover:bg-gray-200" aria-label="Close">
              ✕
            </button>
          </div>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Adjust the macro targets to personalize this meal for your client.
          </p>
        </div>

        <div className="py-4">
          <h3 className="text-lg font-semibold mb-3">Current Macros</h3>
          <div className="grid grid-cols-3 gap-4 mb-6 p-3 rounded-lg" style={{ background: 'var(--color-bg-alt)' }}>
            <div className="rounded-xl p-4 text-center" style={{ background: 'var(--color-accent-translucent)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                {meal.protein}g
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                Protein
              </div>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: 'var(--color-accent-translucent)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                {meal.carbs}g
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                Carbs
              </div>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: 'var(--color-accent-translucent)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                {meal.fat}g
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                Fat
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-3">Target Macros</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-1">Protein (g)</label>
              <input
                type="number"
                min="0"
                value={macroTarget.protein}
                onChange={e => handleMacroChange('protein', parseInt(e.target.value) || 0)}
                className="w-full p-2 border rounded"
                style={{
                  background: 'var(--color-bg-alt)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Carbs (g)</label>
              <input
                type="number"
                min="0"
                value={macroTarget.carbs}
                onChange={e => handleMacroChange('carbs', parseInt(e.target.value) || 0)}
                className="w-full p-2 border rounded"
                style={{
                  background: 'var(--color-bg-alt)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Fat (g)</label>
              <input
                type="number"
                min="0"
                value={macroTarget.fat}
                onChange={e => handleMacroChange('fat', parseInt(e.target.value) || 0)}
                className="w-full p-2 border rounded"
                style={{
                  background: 'var(--color-bg-alt)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Approximate calories: {Math.round(macroTarget.protein * 4 + macroTarget.carbs * 4 + macroTarget.fat * 9)}{' '}
            kcal
          </div>

          <button
            onClick={handleScaleMeal}
            className="px-4 py-2 mb-6 rounded"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-text-on-accent)',
            }}
          >
            Scale Recipe
          </button>

          {error && (
            <div className="p-4 mb-4 rounded" style={{ background: '#FFEBE9', color: '#D73A49' }}>
              {error}
            </div>
          )}

          {scaledRecipeResult && (
            <div className="border rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-3">
                Scaled Recipe
                <span className="ml-2 text-sm font-normal" style={{ color: 'var(--color-text-muted)' }}>
                  ({Math.round(scaledRecipeResult.macroMatchAccuracy * 100)}% match)
                </span>
              </h3>

              <div className="mb-4">
                <h4 className="text-lg mb-2">Ingredients</h4>
                <ul className="space-y-1">
                  {scaledRecipeResult.ingredients.map((ingredient: any, idx: number) => (
                    <li key={idx} className="flex justify-between">
                      <div>
                        <span className="font-medium">{ingredient.food.name}:</span> {ingredient.quantity}{' '}
                        {ingredient.food.servingUnit === 'piece'
                          ? ingredient.quantity === 1
                            ? 'piece'
                            : 'pieces'
                          : ingredient.food.servingUnit}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        P: {ingredient.macros.protein}g, C: {ingredient.macros.carbs}g, F: {ingredient.macros.fat}g
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-lg mb-2">Total Macros</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-2 rounded" style={{ background: 'var(--color-bg-alt)' }}>
                    <div className="font-semibold">Protein</div>
                    <div>{scaledRecipeResult.totalMacros.protein}g</div>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'var(--color-bg-alt)' }}>
                    <div className="font-semibold">Carbs</div>
                    <div>{scaledRecipeResult.totalMacros.carbs}g</div>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'var(--color-bg-alt)' }}>
                    <div className="font-semibold">Fat</div>
                    <div>{scaledRecipeResult.totalMacros.fat}g</div>
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <span className="font-semibold">Total Calories:</span> {scaledRecipeResult.totalMacros.kcal} kcal
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 gap-3">
          {scaledRecipeResult && (
            <button
              onClick={() => {
                if (meal && scaledRecipeResult) {
                  setSaving(true);

                  try {
                    // Create an updated meal with the new macros from the scaled recipe
                    const updatedMeal = {
                      ...meal,
                      protein: scaledRecipeResult.totalMacros.protein,
                      carbs: scaledRecipeResult.totalMacros.carbs,
                      fat: scaledRecipeResult.totalMacros.fat,
                      calories: scaledRecipeResult.totalMacros.kcal,
                      // Update ingredients based on scaled recipe
                      ingredients: scaledRecipeResult.ingredients.map((item: any) => ({
                        id: item.food.id,
                        name: item.food.name,
                        amount: item.quantity,
                        unit: item.food.servingUnit,
                      })),
                    };

                    console.log('Saving updated meal with new macros:', updatedMeal);

                    // Call the onSave prop if provided
                    if (onSave) {
                      onSave(updatedMeal);
                    }

                    // Send the updated meal to the server
                    fetch(`/api/meals/${meal.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(updatedMeal),
                    })
                      .then(response => {
                        if (!response.ok) {
                          throw new Error(`Failed to update meal: ${response.status}`);
                        }
                        return response.json();
                      })
                      .then(() => {
                        // Show success alert
                        alert('Meal has been updated with new macros!');
                        onCloseAction();
                      })
                      .catch(error => {
                        console.error('Error updating meal:', error);
                        alert(`Error updating meal: ${error.message}. Please try again.`);
                      })
                      .finally(() => {
                        setSaving(false);
                      });
                  } catch (error) {
                    console.error('Error preparing meal update:', error);
                    alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    setSaving(false);
                  }
                }
              }}
              className="px-4 py-2 rounded"
              disabled={saving}
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-text-on-accent)',
              }}
            >
              {saving ? 'Saving...' : 'Update Meal with New Macros'}
            </button>
          )}
          <button onClick={onCloseAction} className="px-4 py-2 rounded bg-gray-200 text-gray-800">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
