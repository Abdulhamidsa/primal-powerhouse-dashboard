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
    [items],
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
    [onAddIngredientAction],
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Search Ingredients</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="e.g., chicken, rice, spinach..."
            className="input-base flex-1"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--color-accent)]" />
        </div>
      )}

      {error && !isLoading && searchQuery && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-400">{error.message || 'Search failed'}</p>
        </div>
      )}

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
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === filter.key
                ? 'border-transparent bg-[var(--color-accent)] text-[var(--color-text-on-accent)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text)]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {!isLoading && filteredResults.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            Found {filteredResults.length} ingredient{filteredResults.length !== 1 ? 's' : ''}
          </p>

          <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
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

      {!isLoading && searchQuery && filteredResults.length === 0 && !error && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-8 text-center text-[var(--color-text-muted)]">
          <p>No ingredients found</p>
          <p className="mt-2 text-xs">Try a different term or add a new ingredient</p>
        </div>
      )}

      {!isLoading && !searchQuery && mappedItems.length === 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-8 text-center text-[var(--color-text-muted)]">
          <p className="text-sm">Start typing to search for ingredients</p>
          <p className="mt-2 text-xs">Searching your internal ingredients database</p>
        </div>
      )}
    </div>
  );
}
