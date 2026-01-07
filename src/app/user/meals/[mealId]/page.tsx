'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Users, Flame, Drumstick, Wheat, Droplets } from '../../../../../node_modules/lucide-react';

interface Meal {
  id: string;
  name: string;
  type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  ingredients?: string;
  instructions?: string;
  prepTime?: number;
  cookTime?: number;
  servings: number;
  imageUrl?: string;
}

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.mealId) {
      fetchMealDetails();
    }
  }, [params.mealId]);

  const fetchMealDetails = async () => {
    try {
      const response = await fetch(`/api/meals/${params.mealId}`);
      if (response.ok) {
        const data = await response.json();
        setMeal(data);
      } else {
        console.error('Failed to fetch meal details');
      }
    } catch (error) {
      console.error('Error fetching meal details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading meal details...</p>
        </div>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-3">Meal Not Found</h3>
          <p className="text-slate-400 mb-6">The meal you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          <span>Back to Meals</span>
        </button>

        {/* Meal Header */}
        <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 mb-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row">
            {/* Meal Image */}
            {meal.imageUrl && meal.imageUrl.trim() !== '' ? (
              <div className="lg:w-1/2 h-64 lg:h-96 overflow-hidden bg-slate-900">
                <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="lg:w-1/2 h-64 lg:h-96 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                <svg
                  className="w-20 h-20 text-slate-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 6.253v13m0-13C6.5 6.253 2 10.753 2 16.253v0c0 5.5 4.5 10 10 10s10-4.5 10-10v0c0-5.5-4.5-10-10-10z"
                  />
                </svg>
              </div>
            )}

            {/* Meal Info */}
            <div className={meal.imageUrl && meal.imageUrl.trim() !== '' ? 'lg:w-1/2 p-8' : 'w-full p-8'}>
              <h1 className="text-4xl font-bold text-white mb-6">{meal.name}</h1>

              {/* Nutrition Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-1">Calories</p>
                  <p className="text-2xl font-bold text-blue-400">{meal.calories}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-1">Protein</p>
                  <p className="text-2xl font-bold text-green-400">{meal.protein}g</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-1">Carbs</p>
                  <p className="text-2xl font-bold text-orange-400">{meal.carbs}g</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-1">Fat</p>
                  <p className="text-2xl font-bold text-red-400">{meal.fat}g</p>
                </div>
              </div>

              {/* Meal Meta */}
              <div className="space-y-3 text-slate-300">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-blue-400" />
                  <span>
                    Prep: <span className="text-white font-semibold">{formatDuration(meal.prepTime)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-blue-400" />
                  <span>
                    Cook: <span className="text-white font-semibold">{formatDuration(meal.cookTime)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-blue-400" />
                  <span>
                    Servings: <span className="text-white font-semibold">{meal.servings}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients & Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ingredients */}
          {meal.ingredients && (
            <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center">
                  <Wheat size={18} className="text-green-400" />
                </div>
                Ingredients
              </h2>
              <div className="space-y-3">
                {Array.isArray(meal.ingredients) ? (
                  <ul className="space-y-3">
                    {meal.ingredients.map((ingredient: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600/20 flex items-center justify-center mt-0.5">
                          <span className="text-green-400 text-xs font-bold">{index + 1}</span>
                        </span>
                        <span className="text-slate-300">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">{meal.ingredients}</pre>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {meal.instructions && (
            <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <Flame size={18} className="text-blue-400" />
                </div>
                Instructions
              </h2>
              <div className="space-y-4">
                {Array.isArray(meal.instructions) ? (
                  <ol className="space-y-4">
                    {meal.instructions.map((instruction: string, index: number) => (
                      <li key={index} className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                          {index + 1}
                        </span>
                        <span className="text-slate-300 pt-1">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                    {meal.instructions}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fiber and Additional Info */}
        {meal.fiber !== undefined && (
          <div className="mt-8 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center">
                <Droplets size={18} className="text-orange-400" />
              </div>
              Additional Nutrition
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                <p className="text-slate-400 text-sm mb-1">Fiber</p>
                <p className="text-2xl font-bold text-orange-400">{meal.fiber}g</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
