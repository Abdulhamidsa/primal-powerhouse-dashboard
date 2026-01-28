'use client';

import React, { useState } from 'react';
import { MacroTarget, FoodSelection, ScaledRecipe, Food } from '@/lib/meal-planner/types';
import { recipeTemplates, foodsDatabase, scaleRecipe } from '@/lib/meal-planner';

/**
 * Props for the MealPlannerComponent
 */
interface MealPlannerComponentProps {
  initialRecipeId?: string;
  initialMacroTarget?: MacroTarget;
}

/**
 * MealPlannerComponent - A React component for the meal planner
 */
export default function MealPlannerComponent({
  initialRecipeId = recipeTemplates[0].id,
  initialMacroTarget = { protein: 30, carbs: 40, fat: 15 },
}: MealPlannerComponentProps) {
  // State for selected recipe
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(initialRecipeId);
  const selectedRecipe = recipeTemplates.find(r => r.id === selectedRecipeId) || recipeTemplates[0];

  // State for macro targets
  const [macroTarget, setMacroTarget] = useState<MacroTarget>(initialMacroTarget);

  // State for food selections
  const [foodSelections, setFoodSelections] = useState<FoodSelection[]>(
    selectedRecipe.anchors.map(anchor => ({
      anchorId: anchor.id,
      foodId: anchor.defaultFoodId || anchor.allowedFoodIds[0],
    }))
  );

  // State for the scaled recipe
  const [scaledRecipe, setScaledRecipe] = useState<ScaledRecipe | null>(null);

  // Handle recipe selection change
  const handleRecipeChange = (recipeId: string) => {
    const newRecipe = recipeTemplates.find(r => r.id === recipeId) || recipeTemplates[0];
    setSelectedRecipeId(recipeId);

    // Update food selections with defaults for the new recipe
    setFoodSelections(
      newRecipe.anchors.map(anchor => ({
        anchorId: anchor.id,
        foodId: anchor.defaultFoodId || anchor.allowedFoodIds[0],
      }))
    );
  };

  // Handle macro target changes
  const handleMacroChange = (macro: keyof MacroTarget, value: number) => {
    setMacroTarget(prev => ({
      ...prev,
      [macro]: value,
    }));
  };

  // Handle food selection changes
  const handleFoodSelectionChange = (anchorId: string, foodId: string) => {
    setFoodSelections(prev => {
      const updatedSelections = [...prev];
      const index = updatedSelections.findIndex(s => s.anchorId === anchorId);

      if (index >= 0) {
        updatedSelections[index] = { anchorId, foodId };
      } else {
        updatedSelections.push({ anchorId, foodId });
      }

      return updatedSelections;
    });
  };

  // Generate the scaled recipe
  const handleGenerateRecipe = () => {
    const result = scaleRecipe(selectedRecipe, macroTarget, foodSelections, foodsDatabase);

    setScaledRecipe(result);
  };

  // Find a food by ID
  const findFood = (foodId: string): Food | undefined => {
    return foodsDatabase.find(f => f.id === foodId);
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h2 className="text-2xl font-bold mb-6">Meal Planner</h2>

      {/* Recipe Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">1. Select Recipe Template</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipeTemplates.map(recipe => (
            <div
              key={recipe.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedRecipeId === recipe.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-blue-300 dark:border-gray-700'
              }`}
              onClick={() => handleRecipeChange(recipe.id)}
            >
              <h4 className="font-medium">{recipe.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{recipe.description}</p>
              <div className="mt-2 text-xs">
                <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded mr-2 mb-1">
                  {recipe.estimatedTimeMinutes} min
                </span>
                {recipe.tags?.map(tag => (
                  <span key={tag} className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded mr-2 mb-1">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Macro Targets */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">2. Set Macro Targets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-1">Protein (g)</label>
            <input
              type="number"
              min="0"
              value={macroTarget.protein}
              onChange={e => handleMacroChange('protein', parseInt(e.target.value) || 0)}
              className="w-full p-2 border rounded"
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
            />
          </div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Approximate calories: {Math.round(macroTarget.protein * 4 + macroTarget.carbs * 4 + macroTarget.fat * 9)} kcal
        </div>
      </div>

      {/* Food Selections */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">3. Choose Ingredients</h3>
        <div className="space-y-4">
          {selectedRecipe.anchors.map(anchor => {
            const currentSelection =
              foodSelections.find(s => s.anchorId === anchor.id)?.foodId ||
              anchor.defaultFoodId ||
              anchor.allowedFoodIds[0];

            return (
              <div key={anchor.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{anchor.name}</h4>
                  {!anchor.required && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Optional</span>
                  )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{anchor.description}</p>

                <label className="block text-sm mb-1">Select Option:</label>
                <select
                  value={currentSelection}
                  onChange={e => handleFoodSelectionChange(anchor.id, e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  {anchor.allowedFoodIds.map(foodId => {
                    const food = findFood(foodId);
                    return food ? (
                      <option key={foodId} value={foodId}>
                        {food.name}
                      </option>
                    ) : null;
                  })}
                </select>

                {/* Show selected food macros */}
                {currentSelection && (
                  <div className="mt-2 text-xs">
                    <p className="font-medium">Macros per 100g/serving:</p>
                    <div className="flex gap-3 mt-1">
                      {findFood(currentSelection) && (
                        <>
                          <span>P: {findFood(currentSelection)?.macrosPer100g.protein}g</span>
                          <span>C: {findFood(currentSelection)?.macrosPer100g.carbs}g</span>
                          <span>F: {findFood(currentSelection)?.macrosPer100g.fat}g</span>
                          <span>{findFood(currentSelection)?.macrosPer100g.kcal} kcal</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Generate Button */}
      <div className="mb-8">
        <button
          onClick={handleGenerateRecipe}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Generate Recipe
        </button>
      </div>

      {/* Results */}
      {scaledRecipe && (
        <div className="mb-8 border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">
            {scaledRecipe.recipeTemplate.name}
            <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-300">
              ({Math.round(scaledRecipe.macroMatchAccuracy * 100)}% match)
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Ingredients</h4>
              <ul className="space-y-2">
                {scaledRecipe.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="flex justify-between">
                    <div>
                      <span className="font-medium">{ingredient.food.name}:</span> {ingredient.quantity}{' '}
                      {ingredient.food.servingUnit === 'piece'
                        ? ingredient.quantity === 1
                          ? 'piece'
                          : 'pieces'
                        : ingredient.food.servingUnit}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      P: {ingredient.macros.protein}g, C: {ingredient.macros.carbs}g, F: {ingredient.macros.fat}g
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Nutrition</h4>

              <div className="mb-4">
                <h5 className="text-sm font-medium mb-1">Target Macros</h5>
                <div className="flex gap-3">
                  <span>P: {scaledRecipe.targetMacros.protein}g</span>
                  <span>C: {scaledRecipe.targetMacros.carbs}g</span>
                  <span>F: {scaledRecipe.targetMacros.fat}g</span>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-sm font-medium mb-1">Actual Macros</h5>
                <div className="flex gap-3">
                  <span>P: {scaledRecipe.totalMacros.protein}g</span>
                  <span>C: {scaledRecipe.totalMacros.carbs}g</span>
                  <span>F: {scaledRecipe.totalMacros.fat}g</span>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium mb-1">Total Calories</h5>
                <span>{scaledRecipe.totalMacros.kcal} kcal</span>
              </div>
            </div>
          </div>

          {scaledRecipe.recipeTemplate.instructions && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">Instructions</h4>
              <p className="whitespace-pre-line">{scaledRecipe.recipeTemplate.instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
