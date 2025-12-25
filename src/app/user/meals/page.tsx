'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, ChefHat } from '../../../../node_modules/lucide-react';

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: number;
  scheduledTime?: string;
  mealPlan: string;
  assignmentId?: string;
  mealType?: string;
}

interface TodaysMeals {
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  snack?: Meal;
}

interface MealAssignment {
  id: string;
  mealType: string;
  dayOfWeek: number;
  portion: number;
  scheduledTime?: string;
  meal: {
    id: string;
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: string;
    instructions: string;
    category: string;
    difficulty: string;
    prepTime: number;
    cookTime: number;
    servings: number;
    tags: string;
  };
  mealPlan: {
    name: string;
  };
}

export default function UserMealsPage() {
  const router = useRouter();
  const [todaysMeals, setTodaysMeals] = useState<TodaysMeals>({});
  const [allMealAssignments, setAllMealAssignments] = useState<MealAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');

  useEffect(() => {
    fetchTodaysMeals();
    fetchAllMealAssignments();
  }, []);

  const fetchTodaysMeals = async () => {
    try {
      const response = await fetch('/api/user/meals/today');
      if (response.ok) {
        const data = await response.json();
        setTodaysMeals(data);
      }
    } catch (error) {
      console.error("Error fetching today's meals:", error);
    }
  };

  const fetchAllMealAssignments = async () => {
    try {
      const response = await fetch('/api/user/meals');
      if (response.ok) {
        const data = await response.json();
        setAllMealAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching all meal assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalNutrition = () => {
    // Calculate from ALL assigned meals, not just today's
    return allMealAssignments.reduce(
      (total, assignment) => ({
        calories: total.calories + assignment.meal.calories * assignment.portion,
        protein: total.protein + assignment.meal.protein * assignment.portion,
        carbs: total.carbs + assignment.meal.carbs * assignment.portion,
        fat: total.fat + assignment.meal.fat * assignment.portion,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const totalNutrition = calculateTotalNutrition();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Meals</h1>
          <p className="text-muted-foreground">Your personalized meal plans</p>
        </div>
      </div>

      {/* Meal Sections */}
      {['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map(mealType => {
        const mealsForType = allMealAssignments.filter(assignment => assignment.mealType.toUpperCase() === mealType);

        if (mealsForType.length === 0) return null;

        return (
          <div key={mealType} className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center">
                <ChefHat className="w-5 h-5 mr-2 text-primary" />
                {mealType.charAt(0) + mealType.slice(1).toLowerCase()} Options
              </h2>
              <span className="text-sm text-muted-foreground">
                {mealsForType.length} meal{mealsForType.length !== 1 ? 's' : ''} assigned
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mealsForType.map(assignment => (
                <div
                  key={assignment.id}
                  className="bg-background p-4 rounded-lg border border-border hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => router.push(`/user/meals/${assignment.meal.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {assignment.meal.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {getDayName(assignment.dayOfWeek)} • {assignment.mealPlan.name}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{assignment.meal.description}</p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{assignment.meal.prepTime + assignment.meal.cookTime} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{assignment.meal.servings} servings</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChefHat className="w-3 h-3" />
                      <span>{assignment.meal.difficulty}</span>
                    </div>
                  </div>

                  {assignment.meal.tags && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {assignment.meal.tags
                        .split(',')
                        .slice(0, 3)
                        .map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      {assignment.meal.tags.split(',').length > 3 && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                          +{assignment.meal.tags.split(',').length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                      onClick={e => {
                        e.stopPropagation();
                        router.push(`/user/meals/${assignment.meal.id}`);
                      }}
                    >
                      View Details
                    </button>
                  </div>

                  {assignment.scheduledTime && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Recommended time: {assignment.scheduledTime}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
