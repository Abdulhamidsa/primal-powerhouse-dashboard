'use client';

import { computeNutritionForGrams } from '@/utils/nutritionCalculations';
import type { SelectedIngredient } from '@/types/openFoodFacts';
import { resolveIngredientUnitByName } from '@/utils/ingredientUnitResolver';

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
  const resolvedUnit = resolveIngredientUnitByName(ingredient.name);
  const effectiveServingUnit = ingredient.servingUnit ?? resolvedUnit?.servingUnit ?? 'g';
  const gramsPerUnit = ingredient.gramsPerUnit ?? resolvedUnit?.gramsPerUnit ?? 0;
  const canUsePieceInput = effectiveServingUnit === 'piece' && gramsPerUnit > 0;
  const displayUnitLabel = ingredient.displayUnitLabel || resolvedUnit?.displayUnitLabel || 'piece';
  const pieceCount = canUsePieceInput ? Math.max(1, Math.round((ingredient.grams / gramsPerUnit) * 100) / 100) : 0;

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

      {/* Quantity Input */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-zinc-400 uppercase tracking-wide">
          {canUsePieceInput ? 'Quantity:' : 'Grams:'}
        </label>
        {canUsePieceInput ? (
          <>
            <input
              type="number"
              value={pieceCount}
              onChange={e => {
                const nextPieces = Math.max(1, Number(e.target.value));
                const nextGrams = Math.round(nextPieces * gramsPerUnit * 100) / 100;
                onUpdateGramsAction(nextGrams);
              }}
              min="1"
              step="1"
              className="w-24 px-3 py-2 bg-zinc-700 border border-zinc-600 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <span className="text-xs text-zinc-400">
              {displayUnitLabel}
              {pieceCount > 1 ? 's' : ''}
            </span>
            <span className="text-xs text-zinc-500">(≈{Math.round(gramsPerUnit)}g each)</span>
            <span className="text-xs text-zinc-500">({ingredient.grams}g total)</span>
          </>
        ) : (
          <input
            type="number"
            value={ingredient.grams}
            onChange={e => onUpdateGramsAction(Number(e.target.value))}
            min="1"
            max="9999"
            className="w-20 px-3 py-2 bg-zinc-700 border border-zinc-600 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        )}
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
