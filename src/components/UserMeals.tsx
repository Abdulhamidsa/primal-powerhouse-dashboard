'use client';

import { ForkKnifeIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  CaretLeftIcon as ChevronLeft,
  CaretRightIcon as ChevronRight,
  ForkKnifeIcon as Utensils,
} from '@phosphor-icons/react';
import { getMealImageDelivery } from '@/features/meals/utils/mealImageDelivery';

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

function OptimizedMealImage({ src, alt }: { src: string; alt: string }) {
  const image = getMealImageDelivery(src, 'card');

  return (
    <Image
      src={image.src}
      alt={alt}
      fill
      className="object-cover hover:scale-110 transition-transform duration-300"
      unoptimized={image.unoptimized}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only run when userId changes

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
            <Utensils aria-hidden="true" focusable="false" className="w-10 h-10 text-green-400" />
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
                      <ChevronLeft aria-hidden="true" focusable="false" size={16} />
                    </button>
                    <button
                      onClick={() => scrollCarousel(type, 'right')}
                      disabled={!canScrollRight}
                      className="p-2 rounded-full bg-slate-700/50 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-600/50 transition-colors"
                    >
                      <ChevronRight aria-hidden="true" focusable="false" size={16} />
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
                        className="rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-zinc-800/50 border border-zinc-700/50 flex flex-col h-full"
                        onClick={() => router.push(`/user/meals/${meal.id}`)}
                      >
                        {/* Image Container */}
                        <div className="relative w-full h-40 bg-zinc-900 overflow-hidden">
                          {meal.imageUrl && meal.imageUrl.trim() !== '' ? (
                            <OptimizedMealImage src={meal.imageUrl} alt={meal.name} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900">
                              <ForkKnifeIcon className="w-12 h-12 text-zinc-500" aria-hidden="true" focusable="false" />
                            </div>
                          )}
                        </div>

                        {/* Content Container */}
                        <div className="p-4 flex-1 flex flex-col">
                          <h4 className="font-semibold text-white mb-3 text-base line-clamp-2 group-hover:text-blue-400">
                            {meal.name}
                          </h4>

                          {/* Nutrition Grid */}
                          <div className="space-y-2 flex-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Calories</span>
                              <span className="text-white font-semibold text-sm">{meal.calories}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Protein</span>
                              <span className="text-white font-semibold text-sm">{meal.protein}g</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Carbs</span>
                              <span className="text-white font-semibold text-sm">{meal.carbs}g</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Fat</span>
                              <span className="text-white font-semibold text-sm">{meal.fat}g</span>
                            </div>
                          </div>

                          {/* View Details Button */}
                          <button className="mt-4 w-full py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-600/30">
                            View Details
                          </button>
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
