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
    ingredient.grams,
  );

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-[var(--color-text)]">{ingredient.name}</h4>
          {ingredient.brand && <p className="text-xs text-[var(--color-text-muted)]">{ingredient.brand}</p>}

          {ingredient.hasIncompleteData && <p className="mt-1 text-xs text-amber-400">Incomplete data</p>}
        </div>

        <button
          onClick={onRemoveAction}
          className="text-sm font-medium text-red-400 transition-colors hover:text-red-300"
        >
          Remove
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          {canUsePieceInput ? 'Quantity' : 'Grams'}
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
              className="input-base w-24"
            />
            <span className="text-xs text-[var(--color-text-muted)]">
              {displayUnitLabel}
              {pieceCount > 1 ? 's' : ''}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">(≈{Math.round(gramsPerUnit)}g each)</span>
            <span className="text-xs text-[var(--color-text-muted)]">({ingredient.grams}g total)</span>
          </>
        ) : (
          <input
            type="number"
            value={ingredient.grams}
            onChange={e => onUpdateGramsAction(Number(e.target.value))}
            min="1"
            max="9999"
            className="input-base w-24"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-1.5">
          <span className="text-orange-400">kcal</span>
          <span className="font-medium text-orange-400">{nutrition.kcal}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400">P</span>
          <span className="font-medium text-emerald-400">{nutrition.protein}g</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-amber-300">C</span>
          <span className="font-medium text-amber-300">{nutrition.carbs}g</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-sky-400">F</span>
          <span className="font-medium text-sky-400">{nutrition.fat}g</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-green-400">Fiber</span>
          <span className="font-medium text-green-400">{nutrition.fiber}g</span>
        </div>
      </div>
    </div>
  );
}
