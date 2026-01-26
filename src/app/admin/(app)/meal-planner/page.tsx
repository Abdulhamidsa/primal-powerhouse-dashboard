'use client';

import React from 'react';
import MealPlannerComponent from '@/components/MealPlannerComponent';

export default function MealPlannerPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Meal Planner</h1>
      <p className="mb-8 text-gray-600 dark:text-gray-300">
        Create customized meal plans based on recipe templates and macro targets.
      </p>

      <MealPlannerComponent />
    </div>
  );
}
