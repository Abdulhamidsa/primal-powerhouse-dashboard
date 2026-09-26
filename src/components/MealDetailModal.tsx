'use client';

import {
  CookingPotIcon,
  ForkKnifeIcon,
  MoonIcon,
  OrangeIcon,
  ShoppingCartIcon,
  SunHorizonIcon,
  SunIcon,
} from '@phosphor-icons/react';
import { ClockIcon, FlameIcon, GearIcon, PencilSimpleIcon, TrashIcon, UsersIcon, XIcon } from '@phosphor-icons/react';
import React, { useState } from 'react';
import Image from 'next/image';
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
        return <SunHorizonIcon size={18} aria-hidden="true" />;
      case 'lunch':
        return <SunIcon size={18} aria-hidden="true" />;
      case 'dinner':
        return <MoonIcon size={18} aria-hidden="true" />;
      case 'snack':
        return <OrangeIcon size={18} aria-hidden="true" />;
      default:
        return <ForkKnifeIcon size={18} aria-hidden="true" />;
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
              <div className="h-64 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden rounded-t-2xl relative">
                <Image src={meal.images[0]} alt={meal.name} fill className="object-cover" />
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
              <XIcon className="w-6 h-6" aria-hidden="true" focusable="false" />
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
                    <ClockIcon className="w-4 h-4" aria-hidden="true" focusable="false" />
                    <span>Prep: {meal.prepTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FlameIcon className="w-4 h-4" aria-hidden="true" focusable="false" />
                    <span>Cook: {meal.cookTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UsersIcon className="w-4 h-4" aria-hidden="true" focusable="false" />
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
                  <GearIcon className="w-4 h-4" aria-hidden="true" focusable="false" />
                  Personalize
                </button>

                {onEdit && (
                  <button
                    onClick={() => onEdit(mealData)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <PencilSimpleIcon className="w-4 h-4" aria-hidden="true" focusable="false" />
                    Edit
                  </button>
                )}

                {onDelete && (
                  <button
                    onClick={() => onDelete(mealData.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" aria-hidden="true" focusable="false" />
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
                  <span className="text-2xl">
                    <ShoppingCartIcon className="h-[1em] w-[1em]" aria-hidden="true" />
                  </span>
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
                  <span className="text-2xl">
                    <CookingPotIcon className="h-[1em] w-[1em]" aria-hidden="true" />
                  </span>
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
          onCloseAction={() => setShowPersonalizeModal(false)}
          onSave={handleMealUpdate}
        />
      )}
    </>
  );
}
