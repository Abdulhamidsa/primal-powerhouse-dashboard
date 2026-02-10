import { MealAssignment } from './client-page/types';

export interface MacroBreakdown {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  fiber: number;
}

export interface DayMacros extends MacroBreakdown {
  dayOfWeek: number;
  dayName: string;
}

export interface MealTypeMacros extends MacroBreakdown {
  mealType: string;
  mealCount: number;
}

export interface NutritionStats {
  weeklyTotals: MacroBreakdown;
  dailyAverages: MacroBreakdown;
  byDay: DayMacros[];
  byMealType: MealTypeMacros[];
  mealCount: number;
  daysWithMeals: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Calculate nutrition statistics from meal assignments
 */
export function calculateNutritionStats(assignments: MealAssignment[]): NutritionStats {
  if (!assignments || assignments.length === 0) {
    return {
      weeklyTotals: { protein: 0, carbs: 0, fat: 0, calories: 0, fiber: 0 },
      dailyAverages: { protein: 0, carbs: 0, fat: 0, calories: 0, fiber: 0 },
      byDay: [],
      byMealType: [],
      mealCount: 0,
      daysWithMeals: 0,
    };
  }

  // Calculate by day of week
  const macrosByDay: Record<number, MacroBreakdown & { count: number }> = {};

  for (let i = 0; i < 7; i++) {
    macrosByDay[i] = { protein: 0, carbs: 0, fat: 0, calories: 0, fiber: 0, count: 0 };
  }

  // Calculate by meal type
  const macrosByMealType: Record<string, MacroBreakdown & { count: number }> = {};

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;

  assignments.forEach(assignment => {
    if (!assignment.meal) return;

    const portion = assignment.portion || 1;
    const meal = assignment.meal;

    // Calculate portion-adjusted macros
    const calories = (meal.calories || 0) * portion;
    const protein = (meal.protein || 0) * portion;
    const carbs = (meal.carbs || 0) * portion;
    const fat = (meal.fat || 0) * portion;
    const fiber = (meal.fiber || 0) * portion;

    // Add to totals
    totalCalories += calories;
    totalProtein += protein;
    totalCarbs += carbs;
    totalFat += fat;
    totalFiber += fiber;

    // Add to day
    const dayOfWeek = typeof assignment.dayOfWeek === 'number' ? assignment.dayOfWeek : 0;
    const dayData = macrosByDay[dayOfWeek];
    if (dayData) {
      dayData.calories += calories;
      dayData.protein += protein;
      dayData.carbs += carbs;
      dayData.fat += fat;
      dayData.fiber += fiber;
      dayData.count += 1;
    }

    // Add to meal type
    const mealType = assignment.mealType || meal.type || 'UNKNOWN';
    if (!macrosByMealType[mealType]) {
      macrosByMealType[mealType] = { protein: 0, carbs: 0, fat: 0, calories: 0, fiber: 0, count: 0 };
    }
    const mealTypeData = macrosByMealType[mealType];
    if (mealTypeData) {
      mealTypeData.calories += calories;
      mealTypeData.protein += protein;
      mealTypeData.carbs += carbs;
      mealTypeData.fat += fat;
      mealTypeData.fiber += fiber;
      mealTypeData.count += 1;
    }
  });

  // Build day breakdown
  const daysWithData = Object.entries(macrosByDay)
    .filter(([_, data]) => data.count > 0)
    .map(([dayNum, data]) => ({
      dayOfWeek: parseInt(dayNum),
      dayName: DAY_NAMES[parseInt(dayNum)] || `Day ${dayNum}`,
      calories: Math.round(data.calories * 10) / 10,
      protein: Math.round(data.protein * 10) / 10,
      carbs: Math.round(data.carbs * 10) / 10,
      fat: Math.round(data.fat * 10) / 10,
      fiber: Math.round(data.fiber * 10) / 10,
    }));

  // Build meal type breakdown
  const mealTypeData = Object.entries(macrosByMealType).map(([mealType, data]) => ({
    mealType,
    mealCount: data.count,
    calories: Math.round(data.calories * 10) / 10,
    protein: Math.round(data.protein * 10) / 10,
    carbs: Math.round(data.carbs * 10) / 10,
    fat: Math.round(data.fat * 10) / 10,
    fiber: Math.round(data.fiber * 10) / 10,
  }));

  // Calculate daily averages
  const daysWithMeals = daysWithData.length;
  const dailyAverages = {
    calories: daysWithMeals > 0 ? Math.round((totalCalories / daysWithMeals) * 10) / 10 : 0,
    protein: daysWithMeals > 0 ? Math.round((totalProtein / daysWithMeals) * 10) / 10 : 0,
    carbs: daysWithMeals > 0 ? Math.round((totalCarbs / daysWithMeals) * 10) / 10 : 0,
    fat: daysWithMeals > 0 ? Math.round((totalFat / daysWithMeals) * 10) / 10 : 0,
    fiber: daysWithMeals > 0 ? Math.round((totalFiber / daysWithMeals) * 10) / 10 : 0,
  };

  return {
    weeklyTotals: {
      calories: Math.round(totalCalories * 10) / 10,
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      fiber: Math.round(totalFiber * 10) / 10,
    },
    dailyAverages,
    byDay: daysWithData,
    byMealType: mealTypeData,
    mealCount: assignments.length,
    daysWithMeals,
  };
}

/**
 * Get macro percentages for a calorie total
 */
export function getMacroPercentages(macros: MacroBreakdown): Record<string, number> {
  if (macros.calories === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  const proteinCals = (macros.protein || 0) * 4;
  const carbsCals = (macros.carbs || 0) * 4;
  const fatCals = (macros.fat || 0) * 9;

  return {
    protein: Math.round((proteinCals / macros.calories) * 100),
    carbs: Math.round((carbsCals / macros.calories) * 100),
    fat: Math.round((fatCals / macros.calories) * 100),
  };
}

/**
 * Get color for macro type
 */
export function getMacroColor(macroType: string): string {
  const colors: Record<string, string> = {
    protein: '#ff6b6b',
    carbs: '#4ecdc4',
    fat: '#ffd93d',
    fiber: '#95e1d3',
    calories: '#a8e6cf',
  };
  return colors[macroType] || '#999';
}
