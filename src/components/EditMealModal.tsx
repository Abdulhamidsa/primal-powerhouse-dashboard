'use client';

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { DataService } from '@/services/dataService';
import ImageUpload from '@/components/ImageUpload';

interface EditMealModalProps {
  isOpen: boolean;
  mealId: string | null;
  onCloseAction: () => void;
  onMealUpdatedAction: () => void;
}

export default function EditMealModal({ isOpen, mealId, onCloseAction, onMealUpdatedAction }: EditMealModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingMeal, setFetchingMeal] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [isPersonalizedMeal, setIsPersonalizedMeal] = useState(false);
  const [clientName, setClientName] = useState<string | null>(null);
  const [templateUsageCount, setTemplateUsageCount] = useState(0);
  const [showTemplateWarning, setShowTemplateWarning] = useState(false);
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch meal data when modal opens
  useEffect(() => {
    const fetchMealData = async () => {
      if (!mealId) return;

      setFetchingMeal(true);
      try {
        const meal = await DataService.getMealById(mealId);
        
        // Check if this is a personalized meal
        setIsPersonalizedMeal(meal.isPersonalized || false);
        
        // If this is a TEMPLATE meal, check how many clients are using it
        if (!meal.isPersonalized) {
          try {
            // Count how many times this meal appears in assignments across all clients
            const response = await fetch(`/api/meals/${mealId}/usage-count`);
            if (response.ok) {
              const { usageCount } = await response.json();
              setTemplateUsageCount(usageCount || 0);
              if (usageCount > 0) {
                setShowTemplateWarning(true);
              }
            }
          } catch (err) {
            console.error('Error checking template usage:', err);
          }
        }
        
        // If personalized, fetch client name
        if (meal.isPersonalized && meal.clientId) {
          try {
            const clients = await DataService.getClients();
            const client = clients.find(c => c.id === meal.clientId);
            setClientName(client?.name || null);
          } catch (err) {
            console.error('Error fetching client:', err);
          }
        }
        
        setFormData({
          name: meal.name || '',
          type: meal.type || 'BREAKFAST',
          calories: String(meal.calories || ''),
          protein: String(meal.protein || ''),
          carbs: String(meal.carbs || ''),
          fat: String(meal.fat || ''),
          fiber: String(meal.fiber || ''),
          ingredients: Array.isArray(meal.ingredients) && meal.ingredients.length > 0 ? meal.ingredients : [''],
          instructions: Array.isArray(meal.instructions) && meal.instructions.length > 0 ? meal.instructions : [''],
          prepTime: String(meal.prepTime || ''),
          cookTime: String(meal.cookTime || ''),
          servings: String(meal.servings || '1'),
          tags: Array.isArray(meal.tags) && meal.tags.length > 0 ? meal.tags : [''],
        });
        
        setCurrentImageUrl(meal.imageUrl || '');
      } catch (error) {
        console.error('Error fetching meal:', error);
        setErrors({ general: 'Failed to load meal data' });
      } finally {
        setFetchingMeal(false);
      }
    };

    if (isOpen && mealId) {
      fetchMealData();
    }
  }, [isOpen, mealId]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Meal name is required';
    if (!formData.calories || isNaN(Number(formData.calories))) newErrors.calories = 'Valid calories required';
    if (!formData.protein || isNaN(Number(formData.protein))) newErrors.protein = 'Valid protein amount required';
    if (!formData.carbs || isNaN(Number(formData.carbs))) newErrors.carbs = 'Valid carbs amount required';
    if (!formData.fat || isNaN(Number(formData.fat))) newErrors.fat = 'Valid fat amount required';
    if (!formData.prepTime || isNaN(Number(formData.prepTime))) newErrors.prepTime = 'Valid prep time required';
    if (!formData.cookTime || isNaN(Number(formData.cookTime))) newErrors.cookTime = 'Valid cook time required';
    if (formData.ingredients.filter(ing => ing.trim()).length === 0)
      newErrors.ingredients = 'At least one ingredient required';
    if (formData.instructions.filter(inst => inst.trim()).length === 0)
      newErrors.instructions = 'At least one instruction required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading || !mealId) {
      console.log('Already submitting or no mealId');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('Updating meal with data:', formData);

      let imageUrl = currentImageUrl;

      // Upload new image to Cloudinary if selected
      if (selectedImageFile) {
        console.log('Uploading new image to Cloudinary...');
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedImageFile);
        uploadFormData.append('folder', 'meals');

        const uploadResponse = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.details || error.error || 'Failed to upload image');
        }

        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.data.url;
        console.log('Image uploaded successfully:', imageUrl);
      }

      // Update meal data with processed values
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
        imageUrl,
      };

      console.log('Updating meal with processed data:', mealData);
      await DataService.updateMeal(mealId, mealData);
      console.log('Meal updated successfully');

      onMealUpdatedAction();
      onCloseAction();
      resetForm();
    } catch (error) {
      console.error('Error updating meal:', error);
      setErrors({ general: `Failed to update meal: ${error instanceof Error ? error.message : 'Unknown error'}` });
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
    });
    setSelectedImageFile(null);
    setCurrentImageUrl('');
    setIsPersonalizedMeal(false);
    setClientName(null);
    setTemplateUsageCount(0);
    setShowTemplateWarning(false);
    setErrors({});
    setUploadError('');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (field: 'ingredients' | 'instructions' | 'tags', index: number, value: string) => {
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

  const handleImageSelect = (file: File | null) => {
    setSelectedImageFile(file);
    setUploadError('');
  };

  const handleImageError = (error: string) => {
    setUploadError(error);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-zinc-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-100">Edit Meal</h2>
            <button 
              onClick={() => {
                onCloseAction();
                resetForm();
              }} 
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <span className="text-2xl text-zinc-400">&times;</span>
            </button>
          </div>
        </div>

        {fetchingMeal ? (
          <div className="p-12 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-zinc-400">Loading meal data...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{errors.general}</div>
            )}

            {/* Template Meal Warning */}
            {showTemplateWarning && !isPersonalizedMeal && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="text-amber-400 font-semibold mb-1">Template Meal - Used by Multiple Clients</h3>
                    <p className="text-amber-300 text-sm mb-3">
                      This is a meal template used by <strong>{templateUsageCount} client{templateUsageCount !== 1 ? 's' : ''}</strong>. Any changes you make here will affect ALL clients who have this meal assigned.
                    </p>
                    <p className="text-amber-200 text-xs">
                      💡 <strong>Tip:</strong> To avoid affecting other clients, edit meals from the individual client&apos;s profile instead. That will only modify that client&apos;s copy.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Personalized Meal Indicator */}
            {isPersonalizedMeal && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h3 className="text-blue-400 font-semibold mb-1">Personalized Meal</h3>
                    <p className="text-blue-300 text-sm">
                      {clientName ? (
                        <>This is a personalized copy for <strong>{clientName}</strong>. Your changes will <strong>only</strong> affect this client&apos;s version, not the original meal template.</>
                      ) : (
                        <>This is a personalized copy for a specific client. Your changes will <strong>only</strong> affect this client&apos;s version, not the original meal template.</>
                      )}
                    </p>
                  </div>
                </div>
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
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Protein (g) *</label>
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
                <label className="block text-sm font-medium text-zinc-300 mb-2">Prep Time (minutes) *</label>
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
                <label className="block text-sm font-medium text-zinc-300 mb-2">Cook Time (minutes) *</label>
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
              {errors.ingredients && <p className="text-red-500 text-sm mt-1">{errors.ingredients}</p>}
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
              {errors.instructions && <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>}
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

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Meal Image</label>
              {currentImageUrl && !selectedImageFile && (
                <div className="mb-4">
                  <p className="text-sm text-zinc-400 mb-2">Current image:</p>
                  <div className="relative w-32 h-32 rounded-lg border border-zinc-700 overflow-hidden">
                    <NextImage 
                      src={currentImageUrl} 
                      alt="Current meal" 
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                </div>
              )}
              <ImageUpload onFileSelectAction={handleImageSelect} onError={handleImageError} disabled={loading} />
              {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
              <p className="text-xs text-zinc-500 mt-2">
                {selectedImageFile 
                  ? 'New image will be uploaded when you update the meal' 
                  : 'Upload a new image to replace the current one'}
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-zinc-700">
              <button
                type="button"
                onClick={() => {
                  onCloseAction();
                  resetForm();
                }}
                className="flex-1 px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Meal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
