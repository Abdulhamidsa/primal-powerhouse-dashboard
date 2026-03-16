import React from 'react';
import { MealCard } from './MealCard';
import { MealsLoadingGrid } from './MealsLoadingGrid';
import { MealsEmptyState } from './MealsEmptyState';
import { MealListItem } from '@/lib/meal-planner/types';

type MealsGridProps = {
  meals: MealListItem[];
  loading: boolean;
  selectedType: string;
  onViewMeal: (meal: MealListItem) => void;
  onEditMeal: (mealId: string) => void;
  onDeleteMeal: (mealId: string) => void;
};

export const MealsGrid = ({ meals, loading, selectedType, onViewMeal, onEditMeal, onDeleteMeal }: MealsGridProps) => {
  if (loading) {
    return <MealsLoadingGrid />;
  }

  if (meals.length === 0) {
    return <MealsEmptyState selectedType={selectedType} />;
  }

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
