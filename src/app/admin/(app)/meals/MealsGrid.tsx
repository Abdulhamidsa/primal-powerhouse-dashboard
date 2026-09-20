import React from 'react';
import { MealCard } from './MealCard';
import { MealsLoadingGrid } from './MealsLoadingGrid';
import { MealsEmptyState } from './MealsEmptyState';
import { MealListItem } from '@/lib/meal-planner/types';

type MealsGridProps = {
  meals: MealListItem[];
  loading: boolean;
  hasActiveFilters: boolean;
  selectedType: string;
  onViewMeal: (meal: MealListItem) => void;
  onEditMeal: (mealId: string) => void;
  onDeleteMeal: (mealId: string) => void;
};

export const MealsGrid = ({
  meals,
  loading,
  hasActiveFilters,
  selectedType,
  onViewMeal,
  onEditMeal,
  onDeleteMeal,
}: MealsGridProps) => {
  if (loading) {
    return <MealsLoadingGrid />;
  }

  if (meals.length === 0) {
    return <MealsEmptyState hasActiveFilters={hasActiveFilters} selectedType={selectedType} />;
  }

  return (
    <section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {meals.map(meal => (
          <MealCard
            key={meal.id}
            meal={meal}
            onViewMeal={onViewMeal}
            onEditMeal={onEditMeal}
            onDeleteMeal={onDeleteMeal}
          />
        ))}
      </div>
    </section>
  );
};
