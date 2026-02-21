'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AddMealModal from '@/components/AddMealModal';
import MealBuilderModal from '@/components/MealBuilderModal';
import EditMealModal from '@/components/EditMealModal';
import NewMealDetailModal from '@/components/NewMealDetailModal';
import { DataService } from '@/services/dataService';
import { Utensils, Flame, BarChart, BarChart2, Sunrise, Sun, Moon, Apple, Clock, Users, Edit } from 'lucide-react';
import { Meal as MealType, MealIngredient, MealInstruction } from '@/types/meal';
import { getOptimizedImageUrl } from '@/lib/cloudinary';

interface Meal {
  id: string;
  name: string;
  type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  tags: string[];
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [mealToEdit, setMealToEdit] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const mealsData = await DataService.getMeals();
      setMeals(mealsData);
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const filteredMeals = selectedType === 'ALL' ? meals : meals.filter(meal => meal.type === selectedType);

  const mealTypes = ['ALL', 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

  // Removed unused getMealTypeColor function

  // Function to convert our Meal interface to the MealType interface for the NewMealDetailModal
  const convertToMealType = (meal: Meal): MealType => {
    // Convert string ingredients to MealIngredient objects
    const ingredientsConverted: MealIngredient[] = meal.ingredients.map((ing, index) => ({
      id: `ing-${index}`,
      name: ing,
      amount: 1,
      unit: 'serving',
    }));

    // Convert string instructions to MealInstruction objects
    const instructionsConverted: MealInstruction[] = meal.instructions.map((ins, index) => ({
      id: `ins-${index}`,
      step: index + 1,
      instruction: ins,
    }));

    return {
      id: meal.id,
      name: meal.name,
      type: meal.type.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      description: '', // Fill with default values for required properties
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      fiber: meal.fiber,
      sodium: 0,
      sugar: 0,
      cholesterol: 0,
      ingredients: ingredientsConverted,
      instructions: instructionsConverted,
      prepTime: meal.prepTime,
      cookTime: meal.cookTime,
      servings: meal.servings,
      tags: meal.tags,
      images: [meal.imageUrl],
      difficulty: 'medium',
      equipment: [],
      tips: [],
      allergens: [],
      createdAt: new Date(meal.createdAt),
      updatedAt: new Date(meal.updatedAt),
    };
  };

  const handleViewMeal = (meal: Meal) => {
    const convertedMeal = convertToMealType(meal);
    setSelectedMeal(convertedMeal);
    setShowDetailModal(true);
  };

  const handleEditMeal = (mealId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMealToEdit(mealId);
    setShowEditModal(true);
  };

  const handleDeleteMeal = async (mealId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMealToDelete(mealId);
  };

  const confirmDelete = async () => {
    if (!mealToDelete) return;

    setDeleting(true);
    try {
      await DataService.deleteMeal(mealToDelete);
      setMeals(meals.filter(meal => meal.id !== mealToDelete));
      setMealToDelete(null);
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete meal');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-zinc-100 mb-2">Meal Management</h1>
            <p className="text-zinc-400">Create and manage nutritious meal plans for your clients</p>
            <div className="mt-4 sm:mt-0 flex gap-3 flex-col sm:flex-row">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <span className="text-xl">+</span>
                Create Manually
              </button>
              <button
                onClick={() => setShowBuilderModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <span className="text-xl">🍽️</span>
                Build from Ingredients
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {mealTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedType === type ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-700'}`}
              >
                {type === 'ALL' ? 'All Meals' : type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className="rounded-2xl p-6 shadow-lg border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Total Meals
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {loading ? '...' : meals.length}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-accent)' }}
              >
                <Utensils size={24} color="white" />
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-6 shadow-lg border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Avg Calories
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {loading
                    ? '...'
                    : meals.length > 0
                      ? Math.round(meals.reduce((sum, meal) => sum + meal.calories, 0) / meals.length)
                      : 0}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-accent)' }}
              >
                <Flame size={24} color="white" />
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-6 shadow-lg border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Avg Protein
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {loading
                    ? '...'
                    : meals.length > 0
                      ? Math.round(meals.reduce((sum, meal) => sum + meal.protein, 0) / meals.length)
                      : 0}
                  g
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-accent)' }}
              >
                <BarChart size={24} color="white" />
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-6 shadow-lg border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Filtered
                </h3>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {filteredMeals.length}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-accent)' }}
              >
                <BarChart2 size={24} color="white" />
              </div>
            </div>
          </div>
        </div>

        {/* Meals Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="rounded-2xl shadow-lg border overflow-hidden"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <div className="h-48 animate-pulse" style={{ background: 'var(--color-bg-alt)' }}></div>
                <div className="p-6">
                  <div className="h-6 rounded animate-pulse mb-3" style={{ background: 'var(--color-bg-alt)' }}></div>
                  <div className="h-4 rounded animate-pulse mb-2" style={{ background: 'var(--color-bg-alt)' }}></div>
                  <div className="h-4 rounded animate-pulse w-3/4" style={{ background: 'var(--color-bg-alt)' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeals.map(meal => (
              <div
                key={meal.id}
                className="rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                onClick={() => handleViewMeal(meal)}
              >
                <div className="relative h-48 w-full">
                  {meal.imageUrl && meal.imageUrl.trim() !== '' ? (
                    <Image
                      src={
                        meal.imageUrl.includes('cloudinary.com')
                          ? getOptimizedImageUrl(meal.imageUrl.split('/upload/')[1] || meal.imageUrl, 'card')
                          : meal.imageUrl
                      }
                      alt={meal.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e: any) => {
                        // Fallback image if the meal image fails to load
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/800/600?food';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      <span className="text-zinc-400">No image available</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2"
                      style={{
                        background: 'var(--color-accent-translucent)',
                        color: 'var(--color-accent)',
                        borderColor: 'var(--color-accent)',
                      }}
                    >
                      {meal.type === 'BREAKFAST' && <Sunrise className="h-4 w-4" />}
                      {meal.type === 'LUNCH' && <Sun className="h-4 w-4" />}
                      {meal.type === 'DINNER' && <Moon className="h-4 w-4" />}
                      {meal.type === 'SNACK' && <Apple className="h-4 w-4" />}
                      {meal.type.charAt(0) + meal.type.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                    {meal.name}
                  </h3>

                  {/* Nutrition Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                        {meal.calories}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Calories
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                        {meal.protein}g
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Protein
                      </p>
                    </div>
                  </div>

                  {/* Timing Info */}
                  <div
                    className="flex items-center justify-between text-sm mb-4"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {meal.prepTime + meal.cookTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {meal.servings} serving{meal.servings > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {meal.tags.slice(0, 3).map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs rounded-full border"
                        style={{
                          background: 'var(--color-bg-alt)',
                          color: 'var(--color-text-muted)',
                          borderColor: 'var(--color-border)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {meal.tags.length > 3 && (
                      <span
                        className="px-2 py-1 text-xs rounded-full border"
                        style={{
                          background: 'var(--color-bg-alt)',
                          color: 'var(--color-text-muted)',
                          borderColor: 'var(--color-border)',
                        }}
                      >
                        +{meal.tags.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
                    <button
                      onClick={e => handleEditMeal(meal.id, e)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 border border-blue-600/30 rounded-lg transition-colors font-medium text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Meal
                    </button>
                    <button
                      onClick={e => handleDeleteMeal(meal.id, e)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/10 text-red-500 hover:bg-red-600/20 border border-red-600/30 rounded-lg transition-colors font-medium text-sm"
                    >
                      <svg
                        className="w-4 h-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete Meal
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-4">
              <Utensils size={48} style={{ margin: '0 auto', color: 'var(--color-text-muted)' }} />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              No meals found
            </h3>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {selectedType === 'ALL'
                ? 'No meals have been added yet.'
                : `No ${selectedType.toLowerCase()} meals found.`}
            </p>
          </div>
        )}
      </div>

      {/* Add Meal Modal */}
      <AddMealModal isOpen={showAddModal} onCloseAction={() => setShowAddModal(false)} onMealAddedAction={fetchMeals} />

      {/* Meal Builder Modal */}
      <MealBuilderModal
        isOpen={showBuilderModal}
        onCloseAction={() => setShowBuilderModal(false)}
        onMealCreatedAction={fetchMeals}
      />

      {/* Edit Meal Modal */}
      <EditMealModal
        isOpen={showEditModal}
        mealId={mealToEdit}
        onCloseAction={() => {
          setShowEditModal(false);
          setMealToEdit(null);
        }}
        onMealUpdatedAction={fetchMeals}
      />

      {/* Meal Detail Modal */}
      <NewMealDetailModal
        meal={selectedMeal}
        isOpen={showDetailModal}
        onCloseAction={() => setShowDetailModal(false)}
      />

      {/* Delete Confirmation Modal */}
      {mealToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl max-w-sm w-full p-6 border border-zinc-700">
            <h2 className="text-2xl font-bold text-zinc-100 mb-4">Delete Meal?</h2>
            <p className="text-zinc-400 mb-6">
              Are you sure you want to delete this meal? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setMealToDelete(null)}
                disabled={deleting}
                className="flex-1 px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
