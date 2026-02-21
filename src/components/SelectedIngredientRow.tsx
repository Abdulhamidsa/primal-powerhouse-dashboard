'use client';

import { computeNutritionForGrams } from '@/utils/nutritionCalculations';
import type { SelectedIngredient } from '@/types/openFoodFacts';

interface SelectedIngredientRowProps {
  ingredient: SelectedIngredient;
  onUpdateGramsAction: (grams: number) => void;
  onRemoveAction: () => void;
}

export default function SelectedIngredientRow({
  ingredient,
  onUpdateGramsAction,
  onRemoveAction,
}: SelectedIngredientRowProps) {
  // Calculate nutrition for the selected grams
  const nutrition = computeNutritionForGrams(
    {
      kcal: ingredient.kcalPer100g ?? 0,
      protein: ingredient.proteinPer100g ?? 0,
      carbs: ingredient.carbsPer100g ?? 0,
      fat: ingredient.fatPer100g ?? 0,
      fiber: ingredient.fiberPer100g ?? 0,
      hasIncompleteData: ingredient.hasIncompleteData,
    },
    ingredient.grams
  );

  return (
    <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/50 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-zinc-100">{ingredient.name}</h4>
          {ingredient.brand && <p className="text-xs text-zinc-400">{ingredient.brand}</p>}

          {ingredient.hasIncompleteData && <p className="text-xs text-amber-500 mt-1">⚠️ Incomplete data</p>}
        </div>

        <button
          onClick={onRemoveAction}
          className="text-red-500 hover:text-red-400 transition-colors font-medium text-sm"
        >
          Remove
        </button>
      </div>

      {/* Grams Input */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-zinc-400 uppercase tracking-wide">Grams:</label>
        <input
          type="number"
          value={ingredient.grams}
          onChange={e => onUpdateGramsAction(Number(e.target.value))}
          min="1"
          max="9999"
          className="w-20 px-3 py-2 bg-zinc-700 border border-zinc-600 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Macro Preview */}
      <div className="grid grid-cols-5 gap-2">
        <div className="bg-zinc-700 rounded-lg p-2 text-center">
          <p className="text-xs text-zinc-400 mb-1">kcal</p>
          <p className="text-sm font-semibold text-blue-400">{nutrition.kcal}</p>
        </div>
        <div className="bg-zinc-700 rounded-lg p-2 text-center">
          <p className="text-xs text-zinc-400 mb-1">P</p>
          <p className="text-sm font-semibold text-amino-100">{nutrition.protein}g</p>
        </div>
        <div className="bg-zinc-700 rounded-lg p-2 text-center">
          <p className="text-xs text-zinc-400 mb-1">C</p>
          <p className="text-sm font-semibold text-orange-400">{nutrition.carbs}g</p>
        </div>
        <div className="bg-zinc-700 rounded-lg p-2 text-center">
          <p className="text-xs text-zinc-400 mb-1">F</p>
          <p className="text-sm font-semibold text-yellow-400">{nutrition.fat}g</p>
        </div>
        <div className="bg-zinc-700 rounded-lg p-2 text-center">
          <p className="text-xs text-zinc-400 mb-1">Fiber</p>
          <p className="text-sm font-semibold text-green-400">{nutrition.fiber}g</p>
        </div>
      </div>
    </div>
  );
}
