'use client';

import type { FoodItem } from '@/types/openFoodFacts';

interface IngredientResultItemProps {
  item: FoodItem;
  onAddAction: (ingredient: FoodItem) => void;
  isAdded?: boolean;
}

export default function IngredientResultItem({ item, onAddAction, isAdded = false }: IngredientResultItemProps) {
  const renderValue = (value: number | null) => (value === null ? '—' : value);

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4 transition-colors hover:bg-[var(--color-surface)]">
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-[var(--color-text)]">{item.name}</h4>

        {(item.dataType || item.category || item.brand) && (
          <p className="truncate text-xs text-[var(--color-text-muted)]">
            {[item.dataType, item.category, item.brand].filter(Boolean).join(' • ')}
          </p>
        )}

        {item.hasIncompleteData && <p className="mt-1 text-xs text-amber-400">Incomplete nutrition data</p>}

        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {item.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300">
            {renderValue(item.kcalPer100g)}
            <span>kcal</span>
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
            {renderValue(item.proteinPer100g)}g<span>P</span>
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
            {renderValue(item.carbsPer100g)}g<span>C</span>
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs text-sky-300">
            {renderValue(item.fatPer100g)}g<span>F</span>
          </span>
        </div>
      </div>

      <button
        onClick={() => onAddAction(item)}
        disabled={isAdded}
        className={`rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
          isAdded
            ? 'cursor-not-allowed border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'
            : 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)] hover:opacity-90'
        }`}
      >
        {isAdded ? 'Added' : 'Add'}
      </button>
    </div>
  );
}
