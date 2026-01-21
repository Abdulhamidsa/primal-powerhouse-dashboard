'use client';

import React, { useState, useEffect } from 'react';
import { Meal, MealIngredient, MealInstruction } from '@/types/meal';
import { Utensils, Sunrise, Sun, Moon, Apple, Save, X } from 'lucide-react';

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
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Initialize the personalized meal when the original meal changes
  useEffect(() => {
    if (meal) {
      // Deep clone the meal to avoid modifying the original
      const mealClone = JSON.parse(JSON.stringify(meal)) as Meal;

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

        // Update timestamps
        personalizedMeal.updatedAt = new Date();

        // Make sure all numeric values are properly converted to numbers
        personalizedMeal.calories = Number(personalizedMeal.calories);
        personalizedMeal.protein = Number(personalizedMeal.protein);
        personalizedMeal.carbs = Number(personalizedMeal.carbs);
        personalizedMeal.fat = Number(personalizedMeal.fat);
        if (personalizedMeal.fiber !== undefined) {
          personalizedMeal.fiber = Number(personalizedMeal.fiber);
        }
        if (personalizedMeal.sugar !== undefined) {
          personalizedMeal.sugar = Number(personalizedMeal.sugar);
        }
        if (personalizedMeal.prepTime !== undefined) {
          personalizedMeal.prepTime = Number(personalizedMeal.prepTime);
        }
        if (personalizedMeal.cookTime !== undefined) {
          personalizedMeal.cookTime = Number(personalizedMeal.cookTime);
        }
        personalizedMeal.servings = Number(personalizedMeal.servings);

        // Call the save callback with the personalized meal and client ID
        console.log('Calling onSaveAction with personalized meal');
        await onSaveAction(personalizedMeal, clientId);

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

      // Recalculate macros if amount changed
      if (field === 'amount') {
        // This is a simple recalculation. In a real app you might have a more sophisticated formula
        const ratio = value / (personalizedMeal.ingredients[index].amount || 1);

        // Update meal macros based on the ingredient change
        // This is simplified - real calculation would depend on ingredient nutritional data
        updateMealMacros();
      }

      updateMealProperty('ingredients', updatedIngredients);
    }
  };

  // Handler for deleting an ingredient
  const deleteIngredient = (index: number) => {
    if (personalizedMeal) {
      const updatedIngredients = [...personalizedMeal.ingredients];
      updatedIngredients.splice(index, 1);
      updateMealProperty('ingredients', updatedIngredients);
      updateMealMacros();
    }
  };

  // Handler for adding a new ingredient
  const addIngredient = () => {
    if (personalizedMeal) {
      const newIngredient: MealIngredient = {
        id: `ingredient-${Date.now()}`,
        name: '',
        amount: 1,
        unit: 'g',
      };

      updateMealProperty('ingredients', [...personalizedMeal.ingredients, newIngredient]);
    }
  };

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
  const updateMealMacros = () => {
    if (!personalizedMeal) return;

    // In a real app, you would calculate this based on a nutrition database
    // This is just a placeholder for demonstration

    // For now, we'll just keep the existing macros
    // In a real app, you would recalculate this based on the ingredients
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
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-text-on-accent)',
              }}
            >
              <Save size={18} />
              Save For Client
            </button>

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
          {/* Name and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Meal Name</label>
              <input
                type="text"
                value={personalizedMeal.name}
                onChange={e => updateMealProperty('name', e.target.value)}
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
                onChange={e => updateMealProperty('type', e.target.value as any)}
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
              onChange={e => updateMealProperty('description', e.target.value)}
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
                onChange={e => updateMealProperty('prepTime', parseInt(e.target.value) || 0)}
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
                onChange={e => updateMealProperty('cookTime', parseInt(e.target.value) || 0)}
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
                onChange={e => updateMealProperty('servings', parseInt(e.target.value) || 1)}
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
                  onChange={e => updateMealProperty('calories', parseInt(e.target.value) || 0)}
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
                  onChange={e => updateMealProperty('protein', parseInt(e.target.value) || 0)}
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
                  onChange={e => updateMealProperty('carbs', parseInt(e.target.value) || 0)}
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
                  onChange={e => updateMealProperty('fat', parseInt(e.target.value) || 0)}
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
                  onChange={e => updateMealProperty('fiber', parseInt(e.target.value) || 0)}
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
                  onChange={e => updateMealProperty('sugar', parseInt(e.target.value) || 0)}
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
              <button
                onClick={addIngredient}
                className="flex items-center gap-1 px-3 py-1 rounded text-sm"
                style={{
                  background: 'var(--color-accent-translucent)',
                  color: 'var(--color-accent)',
                }}
              >
                Add Ingredient
              </button>
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
                      onChange={e => updateIngredient(index, 'name', e.target.value)}
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
                      onChange={e => updateIngredient(index, 'unit', e.target.value)}
                      className="w-full p-1 border rounded text-sm"
                      style={{
                        background: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 flex items-end justify-end h-full">
                    <button
                      onClick={() => deleteIngredient(index)}
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
                onChange={e => {
                  const tagsString = e.target.value;
                  const tagsArray = tagsString
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag !== '');
                  updateMealProperty('tags', tagsArray);
                }}
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
                  <button
                    onClick={() => {
                      const updatedTags = [...personalizedMeal.tags];
                      updatedTags.splice(index, 1);
                      updateMealProperty('tags', updatedTags);
                    }}
                    className="hover:text-opacity-80"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-8 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex gap-3">
              <button
                onClick={onCloseAction}
                className="px-4 py-2 rounded-lg"
                style={{
                  background: 'var(--color-bg-alt)',
                  color: 'var(--color-text)',
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
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
