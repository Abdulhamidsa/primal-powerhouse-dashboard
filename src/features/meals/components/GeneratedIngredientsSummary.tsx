import React from 'react';
import type { GeneratedIngredientTotal } from '@/features/meals/types/generatedIngredientTotals.types';
import { formatIngredientAmount } from '@/utils/ingredientUnitResolver';

interface GeneratedIngredientsSummaryProps {
  totals: GeneratedIngredientTotal[];
}

export default function GeneratedIngredientsSummary({ totals }: GeneratedIngredientsSummaryProps) {
  if (totals.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
      <h4 className="font-semibold text-[var(--color-text)]">Ingredients Totals (All Generated Meals)</h4>
      <ul className="mt-2 space-y-2 text-sm">
        {totals.map(item => (
          <li key={item.key} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
            <div className="font-medium text-[var(--color-text)]">
              {item.label} - {formatIngredientAmount(item.totalGrams, item.label)}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              {item.contributors
                .map(
                  contributor => `${contributor.mealName} (${formatIngredientAmount(contributor.grams, item.label)})`,
                )
                .join(', ')}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
