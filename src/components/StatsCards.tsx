'use client';

import { Meal } from '@/types/meal';
import { ForkKnifeIcon as Utensils, FlameIcon as Flame, BarbellIcon as Dumbbell, ClockIcon as Clock, SunHorizonIcon as Sunrise, SunIcon as Sun, MoonIcon as Moon, OrangeIcon as Apple } from '@phosphor-icons/react';

interface StatsCardsProps {
  meals: Meal[];
}

export default function StatsCards({ meals }: StatsCardsProps) {
  const totalMeals = meals.length;

  const mealsByType = meals.reduce(
    (acc, meal) => {
      acc[meal.type] = (acc[meal.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const averageCalories =
    meals.length > 0 ? Math.round(meals.reduce((sum, meal) => sum + meal.calories, 0) / meals.length) : 0;

  const averageProtein =
    meals.length > 0 ? Math.round(meals.reduce((sum, meal) => sum + meal.protein, 0) / meals.length) : 0;

  const averagePrepTime =
    meals.length > 0
      ? Math.round(meals.reduce((sum, meal) => sum + meal.prepTime + meal.cookTime, 0) / meals.length)
      : 0;

  const mostCommonTags = meals
    .flatMap(meal => meal.tags)
    .reduce(
      (acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

  const topTag = Object.entries(mostCommonTags).sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

  const stats = [
    {
      title: 'Total Meals',
      value: totalMeals.toString(),
      icon: <Utensils aria-hidden="true" focusable="false" size={24} />,
      color: 'var(--color-surface)',
      textColor: 'var(--color-accent)',
      subtitle: 'In your library',
    },
    {
      title: 'Avg Calories',
      value: averageCalories.toString(),
      icon: <Flame aria-hidden="true" focusable="false" size={24} />,
      color: 'var(--color-surface)',
      textColor: 'var(--color-accent)',
      subtitle: 'Per meal',
    },
    {
      title: 'Avg Protein',
      value: `${averageProtein}g`,
      icon: <Dumbbell aria-hidden="true" focusable="false" size={24} />,
      color: 'var(--color-surface)',
      textColor: 'var(--color-accent)',
      subtitle: 'Per meal',
    },
    {
      title: 'Avg Prep Time',
      value: `${averagePrepTime}min`,
      icon: <Clock aria-hidden="true" focusable="false" size={24} />,
      color: 'var(--color-surface)',
      textColor: 'var(--color-accent)',
      subtitle: 'Total time',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="border rounded-xl p-6 transition-opacity duration-300"
          style={{
            background: stat.color,
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div style={{ color: stat.textColor }}>{stat.icon}</div>
            <div style={{ color: 'var(--color-text-muted)' }} className="text-sm font-medium">
              {stat.subtitle}
            </div>
          </div>

          <div style={{ color: stat.textColor }} className="text-3xl font-bold mb-1">
            {stat.value}
          </div>

          <div style={{ color: 'var(--color-text)' }} className="text-sm font-medium">
            {stat.title}
          </div>
        </div>
      ))}

      {/* Meal Type Breakdown */}
      <div
        className="md:col-span-2 lg:col-span-4 rounded-xl p-6 border"
        style={{
          background: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h3 style={{ color: 'var(--color-text)' }} className="text-lg font-semibold mb-4">
          Meal Type Breakdown
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { type: 'breakfast', icon: <Sunrise aria-hidden="true" focusable="false" size={24} />, label: 'Breakfast' },
            { type: 'lunch', icon: <Sun aria-hidden="true" focusable="false" size={24} />, label: 'Lunch' },
            { type: 'dinner', icon: <Moon aria-hidden="true" focusable="false" size={24} />, label: 'Dinner' },
            { type: 'snack', icon: <Apple aria-hidden="true" focusable="false" size={24} />, label: 'Snacks' },
          ].map(({ type, icon, label }) => {
            const count = mealsByType[type] || 0;
            const percentage = totalMeals > 0 ? Math.round((count / totalMeals) * 100) : 0;

            return (
              <div key={type} className="text-center">
                <div style={{ color: 'var(--color-accent)' }} className="mb-2">
                  {icon}
                </div>
                <div style={{ color: 'var(--color-text)' }} className="text-2xl font-bold mb-1">
                  {count}
                </div>
                <div style={{ color: 'var(--color-text-muted)' }} className="text-sm mb-2">
                  {label}
                </div>
                <div className="w-full rounded-full h-2" style={{ background: 'var(--color-bg)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      background: 'var(--color-accent)',
                    }}
                  ></div>
                </div>
                <div style={{ color: 'var(--color-text-muted)' }} className="text-xs mt-1">
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Most Popular Tag */}
        {topTag !== 'None' && (
          <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div style={{ color: 'var(--color-text-muted)' }} className="text-sm">
                  Most popular tag
                </div>
                <div style={{ color: 'var(--color-text)' }} className="text-lg font-semibold">
                  #{topTag}
                </div>
              </div>
              <div style={{ color: 'var(--color-accent)' }}>
                <Utensils aria-hidden="true" focusable="false" size={24} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
