'use client';

import type { NutritionForGrams } from '@/types/openFoodFacts';

interface TotalsPanelProps {
  totals: NutritionForGrams;
  perServing: NutritionForGrams;
  servings: number;
  selectedIngredientsCount: number;
}

export default function TotalsPanel({ totals, perServing, servings, selectedIngredientsCount }: TotalsPanelProps) {
  const showPerServing = servings > 1;

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-100">
          {selectedIngredientsCount === 0 ? 'Nutrition Totals (empty)' : 'Nutrition Totals'}
        </h3>
        {selectedIngredientsCount > 0 && (
          <span className="text-sm text-zinc-400">{selectedIngredientsCount} ingredients</span>
        )}
      </div>

      {selectedIngredientsCount === 0 ? (
        <p className="text-zinc-400 text-center py-4">Add ingredients to see nutrition totals</p>
      ) : (
        <>
          {/* Total Nutrition */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-3">Total Meal</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-zinc-700 rounded-lg p-3">
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Calories</p>
                <p className="text-xl font-bold text-blue-400">{totals.kcal}</p>
              </div>
              <div className="bg-zinc-700 rounded-lg p-3">
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Protein</p>
                <p className="text-xl font-bold text-amino-100">{totals.protein}g</p>
              </div>
              <div className="bg-zinc-700 rounded-lg p-3">
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Carbs</p>
                <p className="text-xl font-bold text-orange-400">{totals.carbs}g</p>
              </div>
              <div className="bg-zinc-700 rounded-lg p-3">
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Fat</p>
                <p className="text-xl font-bold text-yellow-400">{totals.fat}g</p>
              </div>
              <div className="bg-zinc-700 rounded-lg p-3">
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Fiber</p>
                <p className="text-xl font-bold text-green-400">{totals.fiber}g</p>
              </div>
            </div>
          </div>

          {/* Per-Serving Nutrition (if servings > 1) */}
          {showPerServing && (
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Per Serving ({servings})</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-zinc-700 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Calories</p>
                  <p className="text-xl font-bold text-blue-400">{perServing.kcal}</p>
                </div>
                <div className="bg-zinc-700 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Protein</p>
                  <p className="text-xl font-bold text-amino-100">{perServing.protein}g</p>
                </div>
                <div className="bg-zinc-700 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Carbs</p>
                  <p className="text-xl font-bold text-orange-400">{perServing.carbs}g</p>
                </div>
                <div className="bg-zinc-700 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Fat</p>
                  <p className="text-xl font-bold text-yellow-400">{perServing.fat}g</p>
                </div>
                <div className="bg-zinc-700 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Fiber</p>
                  <p className="text-xl font-bold text-green-400">{perServing.fiber}g</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
