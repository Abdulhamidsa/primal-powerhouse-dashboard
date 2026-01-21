'use client';

import React, { useState } from 'react';
import { Meal } from '@/types/meal';
import PersonalizeMealModal from './PersonalizeMealModal';

interface MealDetailModalProps {
  meal: Meal;
  onCloseAction: () => void;
  onEdit?: (meal: Meal) => void;
  onDelete?: (mealId: string) => void;
  onUpdateMeal?: (updatedMeal: Meal) => void;
}

export default function MealDetailModal({ meal, onCloseAction, onEdit, onDelete, onUpdateMeal }: MealDetailModalProps) {
  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);
  const [mealData, setMealData] = useState<Meal>(meal);

  // Handle meal updates from the personalize modal
  const handleMealUpdate = (updatedMeal: Meal) => {
    setMealData(updatedMeal);

    // Call the parent component's update handler if provided
    if (onUpdateMeal) {
      onUpdateMeal(updatedMeal);
    }
  };

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '☀️';
      case 'dinner':
        return '🌙';
      case 'snack':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast':
        return 'bg-orange-900/40 text-orange-300 border-orange-700';
      case 'lunch':
        return 'bg-yellow-900/40 text-yellow-300 border-yellow-700';
      case 'dinner':
        return 'bg-purple-900/40 text-purple-300 border-purple-700';
      case 'snack':
        return 'bg-green-900/40 text-green-300 border-green-700';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="relative">
            {meal.images && meal.images.length > 0 ? (
              <div className="h-64 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden rounded-t-2xl">
                <img src={meal.images[0]} alt={meal.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-64 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-8xl rounded-t-2xl">
                {getMealTypeIcon(meal.type)}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onCloseAction}
              className="absolute top-4 right-4 p-2 bg-zinc-900/90 backdrop-blur-sm rounded-full hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Meal type badge */}
            <div
              className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-medium border ${getMealTypeColor(meal.type)}`}
            >
              {getMealTypeIcon(meal.type)} {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
            </div>
          </div>

          <div className="p-6">
            {/* Title and actions */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-zinc-100 mb-2">{meal.name}</h1>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Prep: {meal.prepTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                      />
                    </svg>
                    <span>Cook: {meal.cookTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>
                      {meal.servings} serving{meal.servings !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPersonalizeModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Personalize
                </button>

                {onEdit && (
                  <button
                    onClick={() => onEdit(mealData)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                )}

                {onDelete && (
                  <button
                    onClick={() => onDelete(mealData.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Nutrition Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-blue-900/30 border border-blue-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{mealData.calories}</div>
                <div className="text-sm text-blue-400 font-medium">Calories</div>
              </div>
              <div className="bg-green-900/30 border border-green-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{mealData.protein}g</div>
                <div className="text-sm text-green-400 font-medium">Protein</div>
              </div>
              <div className="bg-yellow-900/30 border border-yellow-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{mealData.carbs}g</div>
                <div className="text-sm text-yellow-400 font-medium">Carbs</div>
              </div>
              <div className="bg-orange-900/30 border border-orange-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">{mealData.fat}g</div>
                <div className="text-sm text-orange-400 font-medium">Fat</div>
              </div>
              <div className="bg-purple-900/30 border border-purple-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{mealData.fiber}g</div>
                <div className="text-sm text-purple-400 font-medium">Fiber</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ingredients */}
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🛒</span>
                  Ingredients
                </h2>
                <ul className="space-y-2">
                  {mealData.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-zinc-800 rounded-lg">
                      <span className="w-6 h-6 bg-blue-900/50 text-blue-300 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-zinc-300">
                        {typeof ingredient === 'string'
                          ? ingredient
                          : `${ingredient.amount} ${ingredient.unit} ${ingredient.name}${ingredient.notes ? ` (${ingredient.notes})` : ''}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="text-2xl">👨‍🍳</span>
                  Instructions
                </h2>
                <ol className="space-y-3">
                  {mealData.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-3 p-4 bg-zinc-800 rounded-lg">
                      <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-zinc-300 leading-relaxed">
                        {typeof instruction === 'string' ? instruction : instruction.instruction}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Tags */}
            {mealData.tags.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-zinc-100 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {mealData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-900/30 text-blue-300 text-sm rounded-full border border-blue-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personalize Modal */}
      {showPersonalizeModal && (
        <PersonalizeMealModal
          meal={mealData}
          isOpen={showPersonalizeModal}
          onClose={() => setShowPersonalizeModal(false)}
          onSave={handleMealUpdate}
        />
      )}
    </>
  );
}
