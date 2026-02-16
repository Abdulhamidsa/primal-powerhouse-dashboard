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
    <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-zinc-100 truncate">{item.name}</h4>
        {(item.dataType || item.category || item.brand) && (
          <p className="text-xs text-zinc-400 truncate">
            {[item.dataType, item.category, item.brand].filter(Boolean).join(' • ')}
          </p>
        )}

        {item.hasIncompleteData && <p className="text-xs text-amber-500 mt-1">⚠️ Incomplete nutrition data</p>}

        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {item.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs bg-zinc-700/60 text-zinc-200 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
            {renderValue(item.kcalPer100g)}
            <span className="text-xs">kcal/100g</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs bg-amino-100/20 text-amino-100 px-2 py-1 rounded">
            {renderValue(item.proteinPer100g)}g P
          </span>
          <span className="inline-flex items-center gap-1 text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">
            {renderValue(item.carbsPer100g)}g C
          </span>
          <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
            {renderValue(item.fatPer100g)}g F
          </span>
        </div>
      </div>

      <button
        onClick={() => onAddAction(item)}
        disabled={isAdded}
        className={`px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
          isAdded ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isAdded ? '✓ Added' : 'Add'}
      </button>
    </div>
  );
}
