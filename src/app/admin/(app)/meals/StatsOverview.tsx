import React from 'react';
import { Utensils, Flame, BarChart3, Filter } from 'lucide-react';
import { StatsCard } from './StatsCard';

type Meal = {
  calories: number;
  protein: number;
};

type StatsOverviewProps = {
  meals: Meal[];
  filteredMealsCount: number;
  loading: boolean;
};

export const StatsOverview = ({ meals, filteredMealsCount, loading }: StatsOverviewProps) => {
  const totalMeals = meals.length;

  const avgCalories = totalMeals > 0 ? Math.round(meals.reduce((sum, meal) => sum + meal.calories, 0) / totalMeals) : 0;

  const avgProtein = totalMeals > 0 ? Math.round(meals.reduce((sum, meal) => sum + meal.protein, 0) / totalMeals) : 0;

  const stats = [
    {
      title: 'Total Meals',
      value: loading ? '...' : totalMeals,
      icon: Utensils,
    },
    {
      title: 'Avg Calories',
      value: loading ? '...' : avgCalories,
      icon: Flame,
    },
    {
      title: 'Avg Protein',
      value: loading ? '...' : `${avgProtein}g`,
      icon: BarChart3,
    },
    {
      title: 'Filtered',
      value: loading ? '...' : filteredMealsCount,
      icon: Filter,
    },
  ];

  return (
    <section className="mb-8">
      <div className="mb-4 space-y-1">
        <h2 className="text-foreground">Overview</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          A quick summary of your meal library and current filter results.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(stat => (
          <StatsCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} />
        ))}
      </div>
    </section>
  );
};
