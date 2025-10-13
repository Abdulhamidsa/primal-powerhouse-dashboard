'use client';

import { useState } from 'react';
import { DataService } from '@/services/dataService';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMealAdded: () => void;
}

export default function AddMealModal({ isOpen, onClose, onMealAdded }: AddMealModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'BREAKFAST',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    ingredients: [''],
    instructions: [''],
    prepTime: '',
    cookTime: '',
    servings: '1',
    tags: [''],
    imageUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Meal name is required';
    if (!formData.calories || isNaN(Number(formData.calories)))
      newErrors.calories = 'Valid calories required';
    if (!formData.protein || isNaN(Number(formData.protein)))
      newErrors.protein = 'Valid protein amount required';
    if (!formData.carbs || isNaN(Number(formData.carbs)))
      newErrors.carbs = 'Valid carbs amount required';
    if (!formData.fat || isNaN(Number(formData.fat))) newErrors.fat = 'Valid fat amount required';
    if (!formData.prepTime || isNaN(Number(formData.prepTime)))
      newErrors.prepTime = 'Valid prep time required';
    if (!formData.cookTime || isNaN(Number(formData.cookTime)))
      newErrors.cookTime = 'Valid cook time required';
    if (formData.ingredients.filter(ing => ing.trim()).length === 0)
      newErrors.ingredients = 'At least one ingredient required';
    if (formData.instructions.filter(inst => inst.trim()).length === 0)
      newErrors.instructions = 'At least one instruction required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Log the data being submitted
      console.log('Submitting meal form with data:', formData);
      
      // Create a clean meal data object that matches the database schema
      // Only include fields that exist in your Prisma schema
      const mealData = {
        name: formData.name.trim(),
        type: formData.type,
        calories: Number(formData.calories),
        protein: Number(formData.protein),
        carbs: Number(formData.carbs),
        fat: Number(formData.fat),
        fiber: Number(formData.fiber) || 0,
        ingredients: formData.ingredients.filter(ing => ing.trim()),
        instructions: formData.instructions.filter(inst => inst.trim()),
        prepTime: Number(formData.prepTime),
        cookTime: Number(formData.cookTime),
        servings: Number(formData.servings),
        tags: formData.tags.filter(tag => tag.trim()),
        imageUrl:
          formData.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500',
      };

      console.log('Creating meal with processed data:', mealData);
      await DataService.createMeal(mealData);
      console.log('Meal created successfully');
      
      onMealAdded();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating meal:', error);
      setErrors({ general: `Failed to create meal: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'BREAKFAST',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      ingredients: [''],
      instructions: [''],
      prepTime: '',
      cookTime: '',
      servings: '1',
      tags: [''],
      imageUrl: '',
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (
    field: 'ingredients' | 'instructions' | 'tags',
    index: number,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const addArrayItem = (field: 'ingredients' | 'instructions' | 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayItem = (field: 'ingredients' | 'instructions' | 'tags', index: number) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-zinc-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-100">Add New Meal</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {errors.general}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Meal Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-zinc-700'}`}
                placeholder="e.g., Mediterranean Chicken Bowl"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Meal Type *</label>
              <select
                value={formData.type}
                onChange={e => handleInputChange('type', e.target.value)}
                className="w-full px-4 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
                <option value="SNACK">Snack</option>
              </select>
            </div>
          </div>

          {/* Nutrition Info */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Nutrition Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Calories *</label>
                <input
                  type="number"
                  value={formData.calories}
                  onChange={e => handleInputChange('calories', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-zinc-800 text-zinc-100 ${errors.calories ? 'border-red-500' : 'border-zinc-700'}`}
                  placeholder="450"
                />
                {errors.calories && <p className="text-red-500 text-xs mt-1">{errors.calories}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Protein (g) *
                </label>
                <input
                  type="number"
                  value={formData.protein}
                  onChange={e => handleInputChange('protein', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-zinc-800 text-zinc-100 ${errors.protein ? 'border-red-500' : 'border-zinc-700'}`}
                  placeholder="25"
                />
                {errors.protein && <p className="text-red-500 text-xs mt-1">{errors.protein}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Carbs (g) *</label>
                <input
                  type="number"
                  value={formData.carbs}
                  onChange={e => handleInputChange('carbs', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-zinc-800 text-zinc-100 ${errors.carbs ? 'border-red-500' : 'border-zinc-700'}`}
                  placeholder="30"
                />
                {errors.carbs && <p className="text-red-500 text-xs mt-1">{errors.carbs}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Fat (g) *</label>
                <input
                  type="number"
                  value={formData.fat}
                  onChange={e => handleInputChange('fat', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-zinc-800 text-zinc-100 ${errors.fat ? 'border-red-500' : 'border-zinc-700'}`}
                  placeholder="15"
                />
                {errors.fat && <p className="text-red-500 text-xs mt-1">{errors.fat}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Fiber (g)</label>
                <input
                  type="number"
                  value={formData.fiber}
                  onChange={e => handleInputChange('fiber', e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8"
                />
              </div>
            </div>
          </div>

          {/* Timing & Servings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Prep Time (minutes) *
              </label>
              <input
                type="number"
                value={formData.prepTime}
                onChange={e => handleInputChange('prepTime', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-zinc-800 text-zinc-100 ${errors.prepTime ? 'border-red-500' : 'border-zinc-700'}`}
                placeholder="15"
              />
              {errors.prepTime && <p className="text-red-500 text-sm mt-1">{errors.prepTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Cook Time (minutes) *
              </label>
              <input
                type="number"
                value={formData.cookTime}
                onChange={e => handleInputChange('cookTime', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-zinc-800 text-zinc-100 ${errors.cookTime ? 'border-red-500' : 'border-zinc-700'}`}
                placeholder="20"
              />
              {errors.cookTime && <p className="text-red-500 text-sm mt-1">{errors.cookTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Servings</label>
              <input
                type="number"
                value={formData.servings}
                onChange={e => handleInputChange('servings', e.target.value)}
                className="w-full px-4 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1"
                min="1"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-100">Ingredients *</h3>
              <button
                type="button"
                onClick={() => addArrayItem('ingredients')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                + Add Ingredient
              </button>
            </div>
            <div className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={e => handleArrayChange('ingredients', index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 6 oz chicken breast"
                  />
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('ingredients', index)}
                      className="px-3 py-3 text-red-500 hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.ingredients && (
              <p className="text-red-500 text-sm mt-1">{errors.ingredients}</p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-100">Instructions *</h3>
              <button
                type="button"
                onClick={() => addArrayItem('instructions')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                + Add Step
              </button>
            </div>
            <div className="space-y-2">
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <span className="px-3 py-3 bg-zinc-700 rounded-lg text-sm font-medium text-zinc-300 min-w-[40px] text-center">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={instruction}
                    onChange={e => handleArrayChange('instructions', index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Season chicken with salt and pepper"
                  />
                  {formData.instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('instructions', index)}
                      className="px-3 py-3 text-red-500 hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.instructions && (
              <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-100">Tags</h3>
              <button
                type="button"
                onClick={() => addArrayItem('tags')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                + Add Tag
              </button>
            </div>
            <div className="space-y-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={tag}
                    onChange={e => handleArrayChange('tags', index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., high-protein, gluten-free"
                  />
                  {formData.tags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('tags', index)}
                      className="px-3 py-3 text-red-500 hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Image URL (optional)
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={e => handleInputChange('imageUrl', e.target.value)}
              className="w-full px-4 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://images.unsplash.com/photo-..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6 border-t border-zinc-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Meal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
