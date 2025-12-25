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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading meal details...</p>
        </div>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Meal Not Found</h3>
          <p className="text-gray-600 mb-6">The meal you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Meals</span>
        </button>

        {/* Meal Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Meal Image */}
            {meal.imageUrl && (
              <div className="lg:w-1/2">
                <img src={meal.imageUrl} alt={meal.name} className="w-full h-64 lg:h-80 object-cover rounded-xl" />
              </div>
            )}

            {/* Meal Info */}
            <div className={meal.imageUrl ? 'lg:w-1/2' : 'w-full'}>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{meal.name}</h1>

              {/* Meal Meta */}
              <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  <span>Prep: {formatDuration(meal.prepTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  <span>Cook: {formatDuration(meal.cookTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  <span>
                    {meal.servings} serving{meal.servings > 1 ? 's' : ''}
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
              <div className="prose max-w-none">
                {Array.isArray(meal.ingredients) ? (
                  <ul className="text-gray-700 space-y-1">
                    {meal.ingredients.map((ingredient: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <pre className="text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">{meal.ingredients}</pre>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {meal.instructions && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
              <div className="prose max-w-none">
                {Array.isArray(meal.instructions) ? (
                  <ol className="text-gray-700 space-y-2">
                    {meal.instructions.map((instruction: string, index: number) => (
                      <li key={index} className="flex">
                        <span className="text-blue-500 mr-3 font-semibold">{index + 1}.</span>
                        <span className="leading-relaxed">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <pre className="text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">{meal.instructions}</pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
