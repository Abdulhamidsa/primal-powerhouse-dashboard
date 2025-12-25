'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';

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
  const router = useRouter();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
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

          return (
            <div key={type} className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
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
                        onClick={() => router.push(`/user/meals/${meal.id}`)}
                      >
                        {meal.imageUrl && (
                          <img
                            src={meal.imageUrl}
                            alt={meal.name}
                            className="w-full h-32 object-cover rounded-xl mb-3"
                          />
                        )}
                        <h4 className="font-semibold text-white mb-3 text-lg">{meal.name}</h4>

                        {/* Key Nutrition Info */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Calories</span>
                            <span className="text-white font-semibold">{meal.calories}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Protein</span>
                            <span className="text-white font-semibold">{meal.protein}g</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Carbs</span>
                            <span className="text-white font-semibold">{meal.carbs}g</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Fat</span>
                            <span className="text-white font-semibold">{meal.fat}g</span>
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
    </div>
  );
}
