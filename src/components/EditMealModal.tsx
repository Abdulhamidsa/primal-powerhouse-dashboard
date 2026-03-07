'use client';

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { DataService } from '@/services/dataService';
import ImageUpload from '@/components/ImageUpload';
import IngredientSearch from '@/components/IngredientSearch';
import type { SelectedIngredient } from '@/types/openFoodFacts';

type EditableIngredient = {
  id: string;
  name: string;
  amount: number;
  unit: string;
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
};

type EditableInstruction = {
  id: string;
  step: number;
  instruction: string;
};

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
    ingredients: [] as EditableIngredient[],
    instructions: [] as EditableInstruction[],
    prepTime: '',
    cookTime: '',
    servings: '1',
    tags: [''],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const servingsNumber = Math.max(1, Number(formData.servings) || 1);
  const totalsPreview = {
    calories: Number(formData.calories) || 0,
    protein: Number(formData.protein) || 0,
    carbs: Number(formData.carbs) || 0,
    fat: Number(formData.fat) || 0,
    fiber: Number(formData.fiber) || 0,
  };
  const perServingPreview = {
    calories: Math.round(totalsPreview.calories / servingsNumber),
    protein: Math.round((totalsPreview.protein / servingsNumber) * 10) / 10,
    carbs: Math.round((totalsPreview.carbs / servingsNumber) * 10) / 10,
    fat: Math.round((totalsPreview.fat / servingsNumber) * 10) / 10,
    fiber: Math.round((totalsPreview.fiber / servingsNumber) * 10) / 10,
  };

  const recalculateNutritionFields = (ingredients: EditableIngredient[]) => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;
    let hasStructuredNutrition = false;

    ingredients.forEach(ingredient => {
      if (!ingredient.nutritionPer100g) return;

      // Amount is treated as grams by default; piece inputs use gramsPerUnit conversion.
      const grams =
        ingredient.unit === 'piece' && (ingredient.gramsPerUnit ?? 0) > 0
          ? (Number(ingredient.amount) || 0) * Number(ingredient.gramsPerUnit)
          : Number(ingredient.amount) || 0;

      if (grams <= 0) return;

      hasStructuredNutrition = true;
      const ratio = grams / 100;
      calories += (ingredient.nutritionPer100g.caloriesKcal ?? 0) * ratio;
      protein += (ingredient.nutritionPer100g.proteinG ?? 0) * ratio;
      carbs += (ingredient.nutritionPer100g.carbsG ?? 0) * ratio;
      fat += (ingredient.nutritionPer100g.fatG ?? 0) * ratio;
      fiber += (ingredient.nutritionPer100g.fiberG ?? 0) * ratio;
    });

    if (!hasStructuredNutrition) {
      return null;
    }

    return {
      calories: String(Math.round(calories)),
      protein: String(Math.round(protein * 10) / 10),
      carbs: String(Math.round(carbs * 10) / 10),
      fat: String(Math.round(fat * 10) / 10),
      fiber: String(Math.round(fiber * 10) / 10),
    };
  };

  useEffect(() => {
    if (!isOpen) return;

    const nextNutrition = recalculateNutritionFields(formData.ingredients);
    if (!nextNutrition) return;

    setFormData(prev => {
      if (
        prev.calories === nextNutrition.calories &&
        prev.protein === nextNutrition.protein &&
        prev.carbs === nextNutrition.carbs &&
        prev.fat === nextNutrition.fat &&
        prev.fiber === nextNutrition.fiber
      ) {
        return prev;
      }

      return {
        ...prev,
        ...nextNutrition,
      };
    });
  }, [formData.ingredients, isOpen]);

  const normalizeIngredient = (ingredient: unknown, index: number): EditableIngredient => {
    if (ingredient && typeof ingredient === 'object') {
      const value = ingredient as Record<string, unknown>;
      const nutrition =
        value.nutritionPer100g && typeof value.nutritionPer100g === 'object'
          ? (value.nutritionPer100g as Record<string, unknown>)
          : null;

      return {
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
        foodId: typeof value.foodId === 'string' ? value.foodId : undefined,
        gramsPerUnit: typeof value.gramsPerUnit === 'number' ? value.gramsPerUnit : null,
        displayUnitLabel: typeof value.displayUnitLabel === 'string' ? value.displayUnitLabel : null,
        nutritionPer100g: nutrition
          ? {
              caloriesKcal: typeof nutrition.caloriesKcal === 'number' ? nutrition.caloriesKcal : 0,
              proteinG: typeof nutrition.proteinG === 'number' ? nutrition.proteinG : 0,
              carbsG: typeof nutrition.carbsG === 'number' ? nutrition.carbsG : 0,
              fatG: typeof nutrition.fatG === 'number' ? nutrition.fatG : 0,
              fiberG: typeof nutrition.fiberG === 'number' ? nutrition.fiberG : 0,
            }
          : undefined,
      };
    }

    if (typeof ingredient === 'string') {
      return {
        id: `ingredient-${Date.now()}-${index}`,
        name: ingredient,
        amount: 100,
        unit: 'g',
      };
    }

    return {
      id: `ingredient-${Date.now()}-${index}`,
      name: '',
      amount: 100,
      unit: 'g',
    };
  };

  const normalizeInstruction = (instruction: unknown, index: number): EditableInstruction => {
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
          ingredients:
            Array.isArray(meal.ingredients) && meal.ingredients.length > 0
              ? meal.ingredients.map((ingredient: unknown, index: number) => normalizeIngredient(ingredient, index))
              : [normalizeIngredient('', 0)],
          instructions:
            Array.isArray(meal.instructions) && meal.instructions.length > 0
              ? meal.instructions.map((instruction: unknown, index: number) => normalizeInstruction(instruction, index))
              : [normalizeInstruction('', 0)],
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
    if (formData.ingredients.filter(ingredient => ingredient.name.trim()).length === 0)
      newErrors.ingredients = 'At least one ingredient required';
    if (formData.instructions.filter(instruction => instruction.instruction.trim()).length === 0)
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
      const cleanedIngredients = formData.ingredients.filter(ingredient => ingredient.name.trim());
      const recalculatedNutrition = recalculateNutritionFields(cleanedIngredients);

      const mealData = {
        name: formData.name.trim(),
        type: formData.type,
        calories: recalculatedNutrition ? Number(recalculatedNutrition.calories) : Number(formData.calories),
        protein: recalculatedNutrition ? Number(recalculatedNutrition.protein) : Number(formData.protein),
        carbs: recalculatedNutrition ? Number(recalculatedNutrition.carbs) : Number(formData.carbs),
        fat: recalculatedNutrition ? Number(recalculatedNutrition.fat) : Number(formData.fat),
        fiber: recalculatedNutrition ? Number(recalculatedNutrition.fiber) : Number(formData.fiber) || 0,
        ingredients: cleanedIngredients.map(ingredient => {
          const effectiveGrams =
            ingredient.unit === 'piece' && (ingredient.gramsPerUnit ?? 0) > 0
              ? (Number(ingredient.amount) || 0) * Number(ingredient.gramsPerUnit)
              : Number(ingredient.amount) || 0;

          return {
            id: ingredient.id,
            foodId: ingredient.foodId,
            name: ingredient.name,
            amount: Number(ingredient.amount) || 0,
            grams: Math.round(effectiveGrams * 100) / 100,
            unit: ingredient.unit || 'g',
            gramsPerUnit: ingredient.gramsPerUnit ?? null,
            displayUnitLabel: ingredient.displayUnitLabel ?? null,
            nutritionPer100g: ingredient.nutritionPer100g,
          };
        }),
        instructions: formData.instructions
          .filter(instruction => instruction.instruction.trim())
          .map((instruction, index) => ({
            id: instruction.id,
            step: index + 1,
            instruction: instruction.instruction,
          })),
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
      ingredients: [],
      instructions: [],
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

  const handleArrayChange = (field: 'tags', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const addArrayItem = (field: 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayItem = (field: 'tags', index: number) => {
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

  const addIngredientFromDb = (ingredient: SelectedIngredient) => {
    setFormData(prev => {
      const ingredients = [
        ...prev.ingredients,
        {
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
        },
      ];

      const nextNutrition = recalculateNutritionFields(ingredients);
      return {
        ...prev,
        ingredients,
        ...(nextNutrition ?? {}),
      };
    });
  };

  const updateIngredientField = (index: number, field: keyof EditableIngredient, value: string | number) => {
    setFormData(prev => {
      const ingredients = prev.ingredients.map((ingredient, i) =>
        i === index ? { ...ingredient, [field]: value } : ingredient
      );
      const nextNutrition = recalculateNutritionFields(ingredients);

      return {
        ...prev,
        ingredients,
        ...(nextNutrition ?? {}),
      };
    });
  };

  const addIngredientRow = () => {
    setFormData(prev => {
      const ingredients = [
        ...prev.ingredients,
        {
          id: `ingredient-${Date.now()}-${prev.ingredients.length}`,
          name: '',
          amount: 100,
          unit: 'g',
        },
      ];
      const nextNutrition = recalculateNutritionFields(ingredients);
      return {
        ...prev,
        ingredients,
        ...(nextNutrition ?? {}),
      };
    });
  };

  const removeIngredientRow = (index: number) => {
    setFormData(prev => {
      const ingredients =
        prev.ingredients.length > 1 ? prev.ingredients.filter((_, i) => i !== index) : prev.ingredients;
      const nextNutrition = recalculateNutritionFields(ingredients);
      return {
        ...prev,
        ingredients,
        ...(nextNutrition ?? {}),
      };
    });
  };

  const updateInstructionField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((instruction, i) =>
        i === index ? { ...instruction, instruction: value } : instruction
      ),
    }));
  };

  const addInstructionRow = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [
        ...prev.instructions,
        {
          id: `instruction-${Date.now()}-${prev.instructions.length}`,
          step: prev.instructions.length + 1,
          instruction: '',
        },
      ],
    }));
  };

  const removeInstructionRow = (index: number) => {
    setFormData(prev => {
      if (prev.instructions.length <= 1) return prev;
      const next = prev.instructions
        .filter((_, i) => i !== index)
        .map((instruction, i) => ({
          ...instruction,
          step: i + 1,
        }));
      return {
        ...prev,
        instructions: next,
      };
    });
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

            <div className="sticky top-0 z-20 rounded-xl border border-zinc-700 bg-zinc-900/95 backdrop-blur p-3 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold tracking-wide text-zinc-300 uppercase">Live Totals</p>
                <p className="text-xs text-zinc-400">Per serving shown below (servings: {servingsNumber})</p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div className="rounded-lg bg-zinc-800 px-2 py-2 text-center">
                  <p className="text-[10px] text-zinc-400">kcal</p>
                  <p className="text-sm font-semibold text-zinc-100">{totalsPreview.calories}</p>
                  <p className="text-[10px] text-zinc-500">{perServingPreview.calories}/serv</p>
                </div>
                <div className="rounded-lg bg-zinc-800 px-2 py-2 text-center">
                  <p className="text-[10px] text-zinc-400">Protein</p>
                  <p className="text-sm font-semibold text-zinc-100">{totalsPreview.protein}g</p>
                  <p className="text-[10px] text-zinc-500">{perServingPreview.protein}g/serv</p>
                </div>
                <div className="rounded-lg bg-zinc-800 px-2 py-2 text-center">
                  <p className="text-[10px] text-zinc-400">Carbs</p>
                  <p className="text-sm font-semibold text-zinc-100">{totalsPreview.carbs}g</p>
                  <p className="text-[10px] text-zinc-500">{perServingPreview.carbs}g/serv</p>
                </div>
                <div className="rounded-lg bg-zinc-800 px-2 py-2 text-center">
                  <p className="text-[10px] text-zinc-400">Fat</p>
                  <p className="text-sm font-semibold text-zinc-100">{totalsPreview.fat}g</p>
                  <p className="text-[10px] text-zinc-500">{perServingPreview.fat}g/serv</p>
                </div>
                <div className="rounded-lg bg-zinc-800 px-2 py-2 text-center">
                  <p className="text-[10px] text-zinc-400">Fiber</p>
                  <p className="text-sm font-semibold text-zinc-100">{totalsPreview.fiber}g</p>
                  <p className="text-[10px] text-zinc-500">{perServingPreview.fiber}g/serv</p>
                </div>
              </div>
            </div>

            {/* Template Meal Warning */}
            {showTemplateWarning && !isPersonalizedMeal && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="text-amber-400 font-semibold mb-1">Template Meal - Used by Multiple Clients</h3>
                    <p className="text-amber-300 text-sm mb-3">
                      This is a meal template used by{' '}
                      <strong>
                        {templateUsageCount} client{templateUsageCount !== 1 ? 's' : ''}
                      </strong>
                      . Any changes you make here will affect ALL clients who have this meal assigned.
                    </p>
                    <p className="text-amber-200 text-xs">
                      💡 <strong>Tip:</strong> To avoid affecting other clients, edit meals from the individual
                      client&apos;s profile instead. That will only modify that client&apos;s copy.
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
                        <>
                          This is a personalized copy for <strong>{clientName}</strong>. Your changes will{' '}
                          <strong>only</strong> affect this client&apos;s version, not the original meal template.
                        </>
                      ) : (
                        <>
                          This is a personalized copy for a specific client. Your changes will <strong>only</strong>{' '}
                          affect this client&apos;s version, not the original meal template.
                        </>
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
                    readOnly
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
                    readOnly
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
                    readOnly
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
                    readOnly
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
                    readOnly
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addIngredientRow}
                    className="px-4 py-2 bg-zinc-700 text-zinc-100 rounded-lg hover:bg-zinc-600 transition-colors text-sm"
                  >
                    + Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // keeps consistent with personalized flow: add from DB search section below
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    + From DB (search below)
                  </button>
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-zinc-700 p-3 bg-zinc-850">
                <IngredientSearch
                  onAddIngredientAction={addIngredientFromDb}
                  selectedIds={
                    new Set(
                      formData.ingredients
                        .map(ingredient => ingredient.foodId)
                        .filter((foodId): foodId is string => Boolean(foodId))
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={e => updateIngredientField(index, 'name', e.target.value)}
                      className="flex-1 px-4 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg"
                      placeholder="Ingredient name"
                    />
                    <input
                      type="number"
                      value={ingredient.amount}
                      onChange={e => updateIngredientField(index, 'amount', Number(e.target.value) || 0)}
                      className="w-28 px-3 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg"
                      placeholder="grams"
                    />
                    <input
                      type="text"
                      value={ingredient.unit}
                      onChange={e => updateIngredientField(index, 'unit', e.target.value)}
                      className="w-24 px-3 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg"
                      placeholder="unit"
                    />
                    {formData.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredientRow(index)}
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
                  onClick={addInstructionRow}
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
                      value={instruction.instruction}
                      onChange={e => updateInstructionField(index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Season chicken with salt and pepper"
                    />
                    {formData.instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInstructionRow(index)}
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
                    <NextImage src={currentImageUrl} alt="Current meal" fill className="object-cover" sizes="128px" />
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
