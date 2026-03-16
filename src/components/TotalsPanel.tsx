'use client';

import type { NutritionForGrams } from '@/types/openFoodFacts';

interface TotalsPanelProps {
  totals: NutritionForGrams;
  perServing: NutritionForGrams;
  servings: number;
  selectedIngredientsCount: number;
}

type NutritionRowProps = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  caloriesLabel: string;
};

function NutritionRow({ calories, protein, carbs, fat, fiber, caloriesLabel }: NutritionRowProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="shrink-0">
          <p className="text-xs text-[var(--color-text-muted)]">{caloriesLabel}</p>
          <p className="text-4xl font-semibold text-orange-400">{calories}</p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 xl:max-w-3xl">
          <div className="rounded-xl bg-[var(--color-bg-alt)] px-4 py-3 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">Protein</p>
            <p className="text-lg font-semibold text-emerald-400">{protein}g</p>
          </div>

          <div className="rounded-xl bg-[var(--color-bg-alt)] px-4 py-3 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">Carbs</p>
            <p className="text-lg font-semibold text-amber-300">{carbs}g</p>
          </div>

          <div className="rounded-xl bg-[var(--color-bg-alt)] px-4 py-3 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">Fat</p>
            <p className="text-lg font-semibold text-sky-400">{fat}g</p>
          </div>

          <div className="rounded-xl bg-[var(--color-bg-alt)] px-4 py-3 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">Fiber</p>
            <p className="text-lg font-semibold text-green-400">{fiber}g</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TotalsPanel({ totals, perServing, servings, selectedIngredientsCount }: TotalsPanelProps) {
  const showPerServing = servings > 1;

  return (
    <div className="sticky top-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-5 shadow-lg">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text)]">
              {selectedIngredientsCount === 0 ? 'Nutrition Totals (empty)' : 'Nutrition Totals'}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {selectedIngredientsCount === 0
                ? 'Add ingredients to see nutrition totals'
                : `Based on ${selectedIngredientsCount} ingredient${selectedIngredientsCount !== 1 ? 's' : ''}`}
            </p>
          </div>

          {selectedIngredientsCount > 0 && (
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
              {selectedIngredientsCount} ingredients
            </span>
          )}
        </div>

        {selectedIngredientsCount === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-8 text-center text-sm text-[var(--color-text-muted)]">
            Add ingredients to see nutrition totals
          </div>
        ) : (
          <div className="space-y-4">
            <NutritionRow
              calories={totals.kcal}
              protein={totals.protein}
              carbs={totals.carbs}
              fat={totals.fat}
              fiber={totals.fiber}
              caloriesLabel="Calories"
            />

            {showPerServing && (
              <NutritionRow
                calories={perServing.kcal}
                protein={perServing.protein}
                carbs={perServing.carbs}
                fat={perServing.fat}
                fiber={perServing.fiber}
                caloriesLabel="Calories (per serving)"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
