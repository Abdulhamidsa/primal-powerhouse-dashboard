'use client';

import { useCallback, useMemo, useState } from 'react';
import { useFoods } from '@/features/foods/hooks/useFoods';
import IngredientResultItem from './IngredientResultItem';
import type { FoodItem, SelectedIngredient } from '@/types/openFoodFacts';
import { resolveIngredientUnitByName } from '@/utils/ingredientUnitResolver';
import type { FoodRecord } from '@/features/foods/types/food.types';

interface IngredientSearchProps {
  onAddIngredientAction: (ingredient: SelectedIngredient) => void;
  selectedIds: Set<string>;
}

export default function IngredientSearch({ onAddIngredientAction, selectedIds }: IngredientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const searchParams = useMemo(() => {
    const trimmed = searchQuery.trim();
    return {
      q: trimmed,
      isActive: true,
      limit: 40,
    } as const;
  }, [searchQuery]);

  const { items, isLoading, error } = useFoods(searchParams);

  const mappedItems: FoodItem[] = useMemo(
    () =>
      items.map((item: FoodRecord) => ({
        id: item.id,
        name: item.name,
        brand: null,
        dataType: item.source,
        category: item.category,
        ingredientsText: null,
        kcalPer100g: item.caloriesKcal,
        proteinPer100g: item.proteinG,
        carbsPer100g: item.carbsG,
        fatPer100g: item.fatG,
        fiberPer100g: item.fiberG,
        hasIncompleteData: false,
        tags: [item.category, item.state],
        servingUnit: item.baseUnit === 'unit' ? 'piece' : 'g',
        gramsPerUnit: item.gramsPerUnit,
        displayUnitLabel: item.displayUnitLabel,
      })),
    [items]
  );

  const filteredResults = mappedItems.filter(item => {
    const tags = item.tags || [];

    if (activeFilter === 'raw') {
      return tags.includes('raw');
    }

    if (activeFilter === 'cooked') {
      return tags.includes('cooked');
    }

    if (activeFilter === 'dry') {
      return tags.includes('dry');
    }

    if (activeFilter === 'as_sold') {
      return tags.includes('as_sold');
    }

    return true;
  });

  const handleAddIngredient = useCallback(
    (foodItem: FoodItem) => {
      const resolvedUnit = resolveIngredientUnitByName(foodItem.name);
      const effectiveServingUnit = foodItem.servingUnit ?? resolvedUnit?.servingUnit;
      const gramsPerPiece = foodItem.gramsPerUnit ?? resolvedUnit?.gramsPerUnit ?? 0;
      const hasPieceUnit = effectiveServingUnit === 'piece' && gramsPerPiece > 0;
      const selectedIngredient: SelectedIngredient = {
        ...foodItem,
        grams: hasPieceUnit ? Math.round(gramsPerPiece) : 100,
        servingUnit: hasPieceUnit ? 'piece' : effectiveServingUnit,
        gramsPerUnit: hasPieceUnit ? gramsPerPiece : foodItem.gramsPerUnit,
        displayUnitLabel: hasPieceUnit
          ? (foodItem.displayUnitLabel ?? resolvedUnit?.displayUnitLabel ?? 'piece')
          : foodItem.displayUnitLabel,
      };
      onAddIngredientAction(selectedIngredient);
    },
    [onAddIngredientAction]
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Search Ingredients</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="e.g., chicken, rice, spinach..."
            className="flex-1 px-4 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && searchQuery && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p className="text-sm text-amber-500">{error.message || 'Search failed'}</p>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'raw', label: 'Raw' },
          { key: 'cooked', label: 'Cooked' },
          { key: 'dry', label: 'Dry' },
          { key: 'as_sold', label: 'As Sold' },
        ].map(filter => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              activeFilter === filter.key
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {!isLoading && filteredResults.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400">
            Found {filteredResults.length} ingredient{filteredResults.length !== 1 ? 's' : ''}
          </p>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredResults.map((item, index) => (
              <IngredientResultItem
                key={`${item.id}-${item.dataType ?? 'na'}-${index}`}
                item={item}
                onAddAction={handleAddIngredient}
                isAdded={selectedIds.has(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && searchQuery && filteredResults.length === 0 && !error && (
        <div className="text-center py-6 text-zinc-400">
          <p>No ingredients found</p>
          <p className="text-xs mt-2">Try a different term or add a new ingredient</p>
        </div>
      )}

      {/* Initial State */}
      {!isLoading && !searchQuery && mappedItems.length === 0 && (
        <div className="text-center py-6 text-zinc-400">
          <p className="text-sm">Start typing to search for ingredients</p>
          <p className="text-xs mt-2">Searching your internal ingredients database</p>
        </div>
      )}
    </div>
  );
}
