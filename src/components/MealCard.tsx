"use client";

import { Meal } from "@/types/meal";

interface MealCardProps {
  meal: Meal;
  onEdit?: (meal: Meal) => void;
  onDelete?: (mealId: string) => void;
  onView?: (meal: Meal) => void;
}

export default function MealCard({ meal, onEdit, onDelete, onView }: MealCardProps) {
  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case "breakfast":
        return "🌅";
      case "lunch":
        return "☀️";
      case "dinner":
        return "🌙";
      case "snack":
        return "🍎";
      default:
        return "🍽️";
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "breakfast":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "lunch":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "dinner":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "snack":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden group">
      {/* Header with image or placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {meal.images && meal.images.length > 0 ? (
          <img src={meal.images[0]} alt={meal.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">{getMealTypeIcon(meal.type)}</div>
        )}

        {/* Meal type badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium border ${getMealTypeColor(meal.type)}`}>
          {getMealTypeIcon(meal.type)} {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {onView && (
            <button onClick={() => onView(meal)} className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors" title="View details">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}

          {onEdit && (
            <button onClick={() => onEdit(meal)} className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors" title="Edit meal">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          {onDelete && (
            <button onClick={() => onDelete(meal.id)} className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors" title="Delete meal">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">{meal.name}</h3>

        {/* Nutrition summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{meal.calories}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Calories</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{meal.protein}g</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Protein</div>
          </div>
        </div>

        {/* Macros bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Macros</span>
            <span>
              {meal.carbs}C • {meal.fat}F • {meal.fiber}Fb
            </span>
          </div>
          <div className="flex rounded-full overflow-hidden h-2 bg-gray-200">
            <div className="bg-blue-500" style={{ width: `${((meal.protein * 4) / (meal.calories || 1)) * 100}%` }}></div>
            <div className="bg-green-500" style={{ width: `${((meal.carbs * 4) / (meal.calories || 1)) * 100}%` }}></div>
            <div className="bg-yellow-500" style={{ width: `${((meal.fat * 9) / (meal.calories || 1)) * 100}%` }}></div>
          </div>
        </div>

        {/* Time and servings */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{meal.prepTime + meal.cookTime} min</span>
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
                {meal.servings} serving{meal.servings !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {meal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meal.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-200">
                {tag}
              </span>
            ))}
            {meal.tags.length > 3 && <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-full border border-gray-200">+{meal.tags.length - 3} more</span>}
          </div>
        )}
      </div>
    </div>
  );
}
