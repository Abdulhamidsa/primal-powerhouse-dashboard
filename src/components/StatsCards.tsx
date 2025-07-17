"use client";

import { Meal } from "@/types/meal";

interface StatsCardsProps {
  meals: Meal[];
}

export default function StatsCards({ meals }: StatsCardsProps) {
  const totalMeals = meals.length;

  const mealsByType = meals.reduce((acc, meal) => {
    acc[meal.type] = (acc[meal.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageCalories = meals.length > 0 ? Math.round(meals.reduce((sum, meal) => sum + meal.calories, 0) / meals.length) : 0;

  const averageProtein = meals.length > 0 ? Math.round(meals.reduce((sum, meal) => sum + meal.protein, 0) / meals.length) : 0;

  const averagePrepTime = meals.length > 0 ? Math.round(meals.reduce((sum, meal) => sum + meal.prepTime + meal.cookTime, 0) / meals.length) : 0;

  const mostCommonTags = meals
    .flatMap((meal) => meal.tags)
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topTag = Object.entries(mostCommonTags).sort(([, a], [, b]) => b - a)[0]?.[0] || "None";

  const stats = [
    {
      title: "Total Meals",
      value: totalMeals.toString(),
      icon: "🍽️",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-600",
      subtitle: "In your library",
    },
    {
      title: "Avg Calories",
      value: averageCalories.toString(),
      icon: "🔥",
      color: "bg-orange-50 border-orange-200",
      textColor: "text-orange-600",
      subtitle: "Per meal",
    },
    {
      title: "Avg Protein",
      value: `${averageProtein}g`,
      icon: "💪",
      color: "bg-green-50 border-green-200",
      textColor: "text-green-600",
      subtitle: "Per meal",
    },
    {
      title: "Avg Prep Time",
      value: `${averagePrepTime}min`,
      icon: "⏱️",
      color: "bg-purple-50 border-purple-200",
      textColor: "text-purple-600",
      subtitle: "Total time",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.color} border rounded-xl p-6 transition-all duration-300 hover:shadow-md`}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">{stat.icon}</div>
            <div className={`${stat.textColor} text-sm font-medium`}>{stat.subtitle}</div>
          </div>

          <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>{stat.value}</div>

          <div className="text-sm text-gray-600 font-medium">{stat.title}</div>
        </div>
      ))}

      {/* Meal Type Breakdown */}
      <div className="md:col-span-2 lg:col-span-4 bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Meal Type Breakdown</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { type: "breakfast", icon: "🌅", label: "Breakfast" },
            { type: "lunch", icon: "☀️", label: "Lunch" },
            { type: "dinner", icon: "🌙", label: "Dinner" },
            { type: "snack", icon: "🍎", label: "Snacks" },
          ].map(({ type, icon, label }) => {
            const count = mealsByType[type] || 0;
            const percentage = totalMeals > 0 ? Math.round((count / totalMeals) * 100) : 0;

            return (
              <div key={type} className="text-center">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
                <div className="text-sm text-gray-600 mb-2">{label}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
              </div>
            );
          })}
        </div>

        {/* Most Popular Tag */}
        {topTag !== "None" && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Most popular tag</div>
                <div className="text-lg font-semibold text-gray-900">#{topTag}</div>
              </div>
              <div className="text-2xl">🏷️</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
