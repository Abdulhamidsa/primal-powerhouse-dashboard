'use client';

import { useEffect, useState } from 'react';
// Using inline SVGs for carousel navigation

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
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <span className="ml-3 text-muted-foreground">Loading nutrition plan...</span>
      </div>
    );
  }

  if (mealPlans.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Nutrition Plan Yet</h3>
        <p className="text-muted-foreground">Your coach will assign your personalized meal plan soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Nutrition Plan</h2>
        <div className="text-sm text-muted-foreground">Choose from available options</div>
      </div>

      {/* Meal Type Carousels */}
      {mealTypes.map(type => {
        const meals = getMealsByType(type);
        if (meals.length === 0) return null;

        const position = carouselPositions[type] || 0;
        const canScrollLeft = position > 0;
        const canScrollRight = position < Math.max(0, meals.length - 1); // Always allow scrolling through all meals

        return (
          <div key={type} className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground capitalize">{type}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => scrollCarousel(type, 'left')}
                  disabled={!canScrollLeft}
                  className="p-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => scrollCarousel(type, 'right')}
                  disabled={!canScrollRight}
                  className="p-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile-First Carousel */}
            <div className="relative">
              {/* Mobile: Single card view */}
              <div className="block md:hidden">
                <div className="overflow-hidden rounded-lg">
                  <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${position * 100}%)` }}
                  >
                    {meals.map(meal => (
                      <div key={meal.id} className="w-full flex-shrink-0 px-1">
                        <div
                          className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:bg-card-hover transition-colors"
                          onClick={() => setSelectedMeal(meal)}
                        >
                          {meal.imageUrl && (
                            <img
                              src={meal.imageUrl}
                              alt={meal.name}
                              className="w-full h-40 object-cover rounded-lg mb-3"
                            />
                          )}
                          <h4 className="font-medium text-foreground mb-3 text-base">{meal.name}</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{meal.calories}</span>
                              <span className="text-xs">calories</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{meal.protein}g</span>
                              <span className="text-xs">protein</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{meal.carbs}g</span>
                              <span className="text-xs">carbs</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{meal.fat}g</span>
                              <span className="text-xs">fat</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop: Multi-card view */}
              <div className="hidden md:block overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${position * 33.333}%)` }}
                >
                  {meals.map(meal => (
                    <div key={meal.id} className="w-1/3 flex-shrink-0 px-2">
                      <div
                        className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:bg-card-hover transition-colors"
                        onClick={() => setSelectedMeal(meal)}
                      >
                        {meal.imageUrl && (
                          <img
                            src={meal.imageUrl}
                            alt={meal.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        <h4 className="font-medium text-foreground mb-2 line-clamp-2">{meal.name}</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>{meal.calories} cal</div>
                          <div>{meal.protein}g protein</div>
                          <div>{meal.carbs}g carbs</div>
                          <div>{meal.fat}g fat</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground">{selectedMeal.name}</h3>
                <button
                  onClick={() => setSelectedMeal(null)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedMeal.imageUrl && (
                <img
                  src={selectedMeal.imageUrl}
                  alt={selectedMeal.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}

              {/* Nutrition Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-foreground">{selectedMeal.calories}</div>
                  <div className="text-xs text-muted-foreground">Calories</div>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-foreground">{selectedMeal.protein}g</div>
                  <div className="text-xs text-muted-foreground">Protein</div>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-foreground">{selectedMeal.carbs}g</div>
                  <div className="text-xs text-muted-foreground">Carbs</div>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-foreground">{selectedMeal.fat}g</div>
                  <div className="text-xs text-muted-foreground">Fat</div>
                </div>
              </div>

              {/* Meal Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Prep: {formatDuration(selectedMeal.prepTime)}</span>
                  <span>Cook: {formatDuration(selectedMeal.cookTime)}</span>
                  <span>Servings: {selectedMeal.servings}</span>
                </div>

                {selectedMeal.ingredients && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Ingredients</h4>
                    <div className="bg-secondary rounded-lg p-4">
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedMeal.ingredients}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedMeal.instructions && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Instructions</h4>
                    <div className="bg-secondary rounded-lg p-4">
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
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
