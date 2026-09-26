'use client';

import { EyeIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import { Meal } from '@/types/meal';
import {
  SunHorizonIcon as Sunrise,
  SunIcon as Sun,
  MoonIcon as Moon,
  OrangeIcon as Apple,
  ForkKnifeIcon as Utensils,
  ClockIcon as Clock,
  UsersIcon as Users,
} from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface MealCardProps {
  meal: Meal;
  onEdit?: (meal: Meal) => void;
  onDelete?: (mealId: string) => void;
  onView?: (meal: Meal) => void;
}

export default function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const getMealTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return <Sunrise aria-hidden="true" focusable="false" className="h-4 w-4" />;
      case 'lunch':
        return <Sun aria-hidden="true" focusable="false" className="h-4 w-4" />;
      case 'dinner':
        return <Moon aria-hidden="true" focusable="false" className="h-4 w-4" />;
      case 'snack':
        return <Apple aria-hidden="true" focusable="false" className="h-4 w-4" />;
      default:
        return <Utensils aria-hidden="true" focusable="false" className="h-4 w-4" />;
    }
  };

  const getMealTypeIconLarge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return <Sunrise aria-hidden="true" focusable="false" className="h-16 w-16" />;
      case 'lunch':
        return <Sun aria-hidden="true" focusable="false" className="h-16 w-16" />;
      case 'dinner':
        return <Moon aria-hidden="true" focusable="false" className="h-16 w-16" />;
      case 'snack':
        return <Apple aria-hidden="true" focusable="false" className="h-16 w-16" />;
      default:
        return <Utensils aria-hidden="true" focusable="false" className="h-16 w-16" />;
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'lunch':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'dinner':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'snack':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Dialog>
      <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 hover:shadow-md transition-all duration-300 overflow-hidden group">
        {/* Header with image or placeholder */}
        <div className="relative h-48 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
          {meal.images && meal.images.length > 0 ? (
            <Image
              src={meal.images[0]}
              alt={meal.name}
              fill
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500">
              {getMealTypeIconLarge(meal.type)}
            </div>
          )}

          {/* Meal type badge */}
          <div
            className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getMealTypeColor(meal.type)}`}
          >
            {getMealTypeIcon(meal.type)}
            <span>{meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}</span>
          </div>

          {/* Action buttons */}
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <DialogTrigger asChild>
              <button
                className="p-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                title="View details"
              >
                <EyeIcon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" aria-hidden="true" focusable="false" />
              </button>
            </DialogTrigger>

            {onEdit && (
              <button
                onClick={() => onEdit(meal)}
                className="p-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                title="Edit meal"
              >
                <PencilSimpleIcon
                  className="h-4 w-4 text-blue-600 dark:text-blue-500"
                  aria-hidden="true"
                  focusable="false"
                />
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(meal.id)}
                className="p-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                title="Delete meal"
              >
                <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-500" aria-hidden="true" focusable="false" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 dark:text-zinc-100">
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50 mb-2 line-clamp-2">{meal.name}</h3>

          {/* Nutrition summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{meal.calories}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Calories</div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{meal.protein}g</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Protein</div>
            </div>
          </div>

          {/* Macros bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              <span>Macros</span>
              <span>
                {meal.carbs}C • {meal.fat}F • {meal.fiber}Fb
              </span>
            </div>
            <div className="flex rounded-full overflow-hidden h-2 bg-zinc-200 dark:bg-zinc-700">
              <div
                className="bg-blue-500"
                style={{ width: `${((meal.protein * 4) / (meal.calories || 1)) * 100}%` }}
              ></div>
              <div
                className="bg-green-500"
                style={{ width: `${((meal.carbs * 4) / (meal.calories || 1)) * 100}%` }}
              ></div>
              <div
                className="bg-yellow-500"
                style={{ width: `${((meal.fat * 9) / (meal.calories || 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Time and servings */}
          <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock aria-hidden="true" focusable="false" className="h-4 w-4" />
                <span>{meal.prepTime + meal.cookTime} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users aria-hidden="true" focusable="false" className="h-4 w-4" />
                <span>
                  {meal.servings} serving{meal.servings !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {meal.tags && meal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {meal.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full border border-blue-200 dark:border-blue-800"
                >
                  {tag}
                </span>
              ))}
              {meal.tags.length > 3 && (
                <span className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs rounded-full border border-zinc-200 dark:border-zinc-700">
                  +{meal.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog for Meal Details */}
      <DialogContent className="max-w-3xl">
        <div>
          <div className="text-2xl font-bold">{meal.name}</div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getMealTypeColor(meal.type)}`}
          >
            {getMealTypeIcon(meal.type)} {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          {/* Image Section */}
          <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-square bg-zinc-100 dark:bg-zinc-800 relative">
            {meal.images && meal.images.length > 0 ? (
              <Image src={meal.images[0]} alt={meal.name} fill className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                {getMealTypeIconLarge(meal.type)}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div>
            {/* Nutrition Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{meal.calories}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Calories</div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{meal.protein}g</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Protein</div>
              </div>
            </div>

            {/* Macros Breakdown */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Macronutrients</h4>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg">
                  <div className="text-lg font-semibold">{meal.protein}g</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Protein</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg">
                  <div className="text-lg font-semibold">{meal.carbs}g</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Carbs</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg">
                  <div className="text-lg font-semibold">{meal.fat}g</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Fat</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg">
                  <div className="text-lg font-semibold">{meal.fiber}g</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Fiber</div>
                </div>
              </div>
            </div>

            {/* Preparation Info */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Preparation</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg flex flex-col items-center justify-center">
                  <Clock
                    aria-hidden="true"
                    focusable="false"
                    className="h-4 w-4 text-zinc-500 dark:text-zinc-400 mb-1"
                  />
                  <div className="text-sm font-semibold">{meal.prepTime} min</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Prep Time</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg flex flex-col items-center justify-center">
                  <Clock
                    aria-hidden="true"
                    focusable="false"
                    className="h-4 w-4 text-zinc-500 dark:text-zinc-400 mb-1"
                  />
                  <div className="text-sm font-semibold">{meal.cookTime} min</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Cook Time</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg flex flex-col items-center justify-center">
                  <Users
                    aria-hidden="true"
                    focusable="false"
                    className="h-4 w-4 text-zinc-500 dark:text-zinc-400 mb-1"
                  />
                  <div className="text-sm font-semibold">{meal.servings}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Servings</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {meal.tags && meal.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {meal.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full border border-blue-200 dark:border-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between p-6 pt-2">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">ID: {meal.id.slice(0, 8)}...</div>
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(meal)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-md border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <PencilSimpleIcon className="h-4 w-4" aria-hidden="true" focusable="false" /> Edit
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
