'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Users, X, Flame, Beef, Wheat, Droplet } from 'lucide-react';

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

interface MealAssignment {
  id: string;
  dayOfWeek: number;
  mealType: string;
  portion: number;
  scheduledTime?: string;
  notes?: string;
  meal: Meal;
}

interface MealPlan {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  mealAssignments: MealAssignment[];
}

interface UserMealsProps {
  userId: string;
}

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function UserMeals({ userId }: UserMealsProps) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [carouselPositions, setCarouselPositions] = useState<{ [key: string]: number }>({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
  });

  useEffect(() => {
    fetchMealPlans();
  }, [userId]);

  const fetchMealPlans = async () => {
    try {
      const response = await fetch(`/api/user-dashboard/meals?clientId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMealPlans(data);
      } else {
        console.error('Failed to fetch meal plans');
      }
    } catch (error) {
      console.error('Error fetching meal plans:', error);
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

  // Group meals by type
  const getMealsByType = (type: string) => {
    const meals: Meal[] = [];
    mealPlans.forEach(plan => {
      plan.mealAssignments.forEach(assignment => {
        if (assignment.mealType.toLowerCase() === type.toLowerCase()) {
          meals.push(assignment.meal);
        }
      });
    });
    // Remove duplicates
    return meals.filter((meal, index, self) => index === self.findIndex(m => m.id === meal.id));
  };

  const scrollCarousel = (type: string, direction: 'left' | 'right') => {
    const meals = getMealsByType(type);
    // Mobile: 1 card at a time, Desktop: 3 cards at a time
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const cardsPerView = isMobile ? 1 : 3;
    const maxPosition = Math.max(0, meals.length - cardsPerView);

    setCarouselPositions(prev => {
      const currentPos = prev[type] || 0;
      let newPos = currentPos;

      if (direction === 'left') {
        newPos = Math.max(0, currentPos - 1);
      } else {
        newPos = Math.min(maxPosition, currentPos + 1);
      }

      return { ...prev, [type]: newPos };
    });
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading your meals...</p>
        </div>
      </div>
    );
  }

  if (mealPlans.length === 0) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Utensils className="w-10 h-10 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">No Meals Yet</h3>
          <p className="text-slate-400 max-w-sm">
            Your coach will assign your personalized meal plan soon. Check back later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Your Meals</h2>
          <p className="text-slate-400">Nutritious meals crafted for your goals</p>
        </div>

        {/* Meal Type Sections */}
        {mealTypes.map(type => {
          const meals = getMealsByType(type);
          if (meals.length === 0) return null;

          const position = carouselPositions[type] || 0;
          const canScrollLeft = position > 0;
          const canScrollRight = position < Math.max(0, meals.length - 1);

          const typeColors = {
            breakfast: 'from-orange-500/20 to-amber-600/20 border-orange-500/30',
            lunch: 'from-green-500/20 to-emerald-600/20 border-green-500/30',
            dinner: 'from-purple-500/20 to-indigo-600/20 border-purple-500/30',
            snack: 'from-pink-500/20 to-rose-600/20 border-pink-500/30',
          };

          const typeIcons = {
            breakfast: '🌅',
            lunch: '☀️',
            dinner: '🌙',
            snack: '🍎',
          };

          return (
            <div key={type} className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeIcons[type as keyof typeof typeIcons]}</span>
                  <h3 className="text-xl font-semibold text-white capitalize">{type}</h3>
                </div>
                {meals.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollCarousel(type, 'left')}
                      disabled={!canScrollLeft}
                      className="p-2 rounded-full bg-slate-700/50 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-600/50 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => scrollCarousel(type, 'right')}
                      disabled={!canScrollRight}
                      className="p-2 rounded-full bg-slate-700/50 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-600/50 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Carousel */}
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-out gap-4"
                  style={{ transform: `translateX(-${position * 100}%)` }}
                >
                  {meals.map(meal => (
                    <div key={meal.id} className="w-full flex-shrink-0">
                      <div
                        className={`bg-gradient-to-br ${typeColors[type as keyof typeof typeColors]} backdrop-blur-sm border rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transition-all duration-300`}
                        onClick={() => setSelectedMeal(meal)}
                      >
                        {meal.imageUrl && (
                          <img
                            src={meal.imageUrl}
                            alt={meal.name}
                            className="w-full h-32 object-cover rounded-xl mb-3"
                          />
                        )}
                        <h4 className="font-semibold text-white mb-3 text-lg">{meal.name}</h4>

                        {/* Nutrition Grid */}
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                            <Flame className="text-orange-400 w-4 h-4 mx-auto mb-1" />
                            <div className="text-white font-semibold text-sm">{meal.calories}</div>
                            <div className="text-slate-400 text-xs">cal</div>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                            <Beef className="text-red-400 w-4 h-4 mx-auto mb-1" />
                            <div className="text-white font-semibold text-sm">{meal.protein}g</div>
                            <div className="text-slate-400 text-xs">protein</div>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                            <Wheat className="text-yellow-400 w-4 h-4 mx-auto mb-1" />
                            <div className="text-white font-semibold text-sm">{meal.carbs}g</div>
                            <div className="text-slate-400 text-xs">carbs</div>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                            <Droplet className="text-blue-400 w-4 h-4 mx-auto mb-1" />
                            <div className="text-white font-semibold text-sm">{meal.fat}g</div>
                            <div className="text-slate-400 text-xs">fat</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">{selectedMeal.name}</h3>
                <button
                  onClick={() => setSelectedMeal(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {selectedMeal.imageUrl && (
                <img
                  src={selectedMeal.imageUrl}
                  alt={selectedMeal.name}
                  className="w-full h-48 object-cover rounded-xl mb-6"
                />
              )}

              {/* Nutrition Info */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <Flame className="text-orange-400 w-6 h-6 mx-auto mb-2" />
                  <div className="text-xl font-bold text-white">{selectedMeal.calories}</div>
                  <div className="text-sm text-slate-400">Calories</div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <Beef className="text-red-400 w-6 h-6 mx-auto mb-2" />
                  <div className="text-xl font-bold text-white">{selectedMeal.protein}g</div>
                  <div className="text-sm text-slate-400">Protein</div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <Wheat className="text-yellow-400 w-6 h-6 mx-auto mb-2" />
                  <div className="text-xl font-bold text-white">{selectedMeal.carbs}g</div>
                  <div className="text-sm text-slate-400">Carbs</div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <Droplet className="text-blue-400 w-6 h-6 mx-auto mb-2" />
                  <div className="text-xl font-bold text-white">{selectedMeal.fat}g</div>
                  <div className="text-sm text-slate-400">Fat</div>
                </div>
              </div>

              {/* Meal Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-6 text-sm text-slate-400 bg-slate-700/30 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>Prep: {formatDuration(selectedMeal.prepTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>Cook: {formatDuration(selectedMeal.cookTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>
                      {selectedMeal.servings} serving{selectedMeal.servings > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {selectedMeal.ingredients && (
                  <div>
                    <h4 className="font-semibold text-white mb-3 text-lg">Ingredients</h4>
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {selectedMeal.ingredients}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedMeal.instructions && (
                  <div>
                    <h4 className="font-semibold text-white mb-3 text-lg">Instructions</h4>
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {selectedMeal.instructions}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
