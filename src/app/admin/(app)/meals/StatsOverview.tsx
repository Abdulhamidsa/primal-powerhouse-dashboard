import React from 'react';
import {
  ChartBarIcon as BarChart3,
  ChefHatIcon as ChefHat,
  FunnelIcon as Filter,
  FlameIcon as Flame,
  LeafIcon as Leaf,
} from '@phosphor-icons/react/ssr';
import { StatsCard } from './StatsCard';

type Meal = {
  calories: number;
  protein: number;
};

type StatsOverviewProps = {
  meals: Meal[];
  sidesCount: number;
  filteredMealsCount: number;
  loading: boolean;
};

export const StatsOverview = ({ meals, sidesCount, filteredMealsCount, loading }: StatsOverviewProps) => {
  const totalItems = meals.length;

  const avgCalories =
    totalItems > 0 ? Math.round(meals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0) / totalItems) : 0;

  const avgProtein =
    totalItems > 0 ? Math.round(meals.reduce((sum, meal) => sum + (Number(meal.protein) || 0), 0) / totalItems) : 0;

  const stats = [
    {
      title: 'Library items',
      value: loading ? '...' : totalItems,
      icon: ChefHat,
    },
    {
      title: 'Sides',
      value: loading ? '...' : sidesCount,
      icon: Leaf,
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
    <section>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(stat => (
          <StatsCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} />
        ))}
      </div>
    </section>
  );
};
