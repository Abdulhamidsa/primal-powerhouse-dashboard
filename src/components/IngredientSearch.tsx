'use client';

import { useState, useCallback } from 'react';
import { useOpenFoodFactsSearch } from '@/hooks/useOpenFoodFactsSearch';
import IngredientResultItem from './IngredientResultItem';
import type { FoodItem, SelectedIngredient } from '@/types/openFoodFacts';

interface IngredientSearchProps {
  onAddIngredientAction: (ingredient: SelectedIngredient) => void;
  selectedIds: Set<string>;
}

export default function IngredientSearch({ onAddIngredientAction, selectedIds }: IngredientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [allowedCategories, setAllowedCategories] = useState(
    'Cereal Grains and Pasta,Vegetables and Vegetable Products,Fruits and Fruit Juices,Nuts and Seeds,Legumes and Legume Products,Poultry Products,Beef Products,Pork Products,Fish, Finfish, and Shellfish Products,Dairy and Egg Products'
  );
  const [excludedNameTerms, setExcludedNameTerms] = useState(
    'snack,cake,cracker,babyfood,cereal,bread,muffin,bagel,bar,chips'
  );
  const [allowedDataTypes, setAllowedDataTypes] = useState({
    foundation: true,
    srLegacy: true,
  });
  const [formFilter, setFormFilter] = useState<'all' | 'raw' | 'dry' | 'cooked' | 'processed'>('all');
  const { results, isLoading, error, search } = useOpenFoodFactsSearch();

  const handleSearch = useCallback(
    (query: string, includeBranded = false) => {
      setSearchQuery(query);
      const allowedTypes = [
        ...(allowedDataTypes.foundation ? ['Foundation'] : []),
        ...(allowedDataTypes.srLegacy ? ['SR Legacy'] : []),
      ];

      search(query, {
        includeBranded,
        allowedCategories: allowedCategories
          .split(',')
          .map(term => term.trim())
          .filter(Boolean),
        excludedNameTerms: excludedNameTerms
          .split(',')
          .map(term => term.trim())
          .filter(Boolean),
        allowedDataTypes: allowedTypes as Array<'Foundation' | 'SR Legacy'>,
        form: formFilter,
      });
    },
    [search, allowedCategories, excludedNameTerms, allowedDataTypes, formFilter]
  );

  const handleFilterChange = useCallback(
    (filter: string) => {
      setActiveFilter(filter);

      const includeBranded = filter === 'packaged';
      if (searchQuery.trim().length >= 3) {
        handleSearch(searchQuery, includeBranded);
      }
    },
    [handleSearch, searchQuery]
  );

  const filteredResults = results.filter(item => {
    const tags = item.tags || [];

    if (activeFilter === 'packaged') {
      return tags.includes('branded');
    }

    if (activeFilter === 'processed') {
      return tags.includes('processed');
    }

    if (activeFilter === 'raw') {
      return tags.includes('raw');
    }

    if (activeFilter === 'cooked') {
      return tags.includes('cooked');
    }

    if (activeFilter === 'dry') {
      return tags.includes('dry');
    }

    // Default: exclude branded/processed unless explicitly requested
    return !tags.includes('branded') && !tags.includes('processed');
  });

  const handleAddIngredient = useCallback(
    (foodItem: FoodItem) => {
      const selectedIngredient: SelectedIngredient = {
        ...foodItem,
        grams: 100, // Default to 100g
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
            onChange={e => handleSearch(e.target.value, activeFilter === 'packaged')}
            placeholder="e.g., chicken breast, rice, spinach..."
            className="flex-1 px-4 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-zinc-500"
          />
          <button
            onClick={() => handleSearch(searchQuery, activeFilter === 'packaged')}
            disabled={isLoading || searchQuery.trim().length < 3}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Searching...</span>
              </>
            ) : (
              'Search'
            )}
          </button>
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
          <p className="text-sm text-amber-500">{error}</p>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'raw', label: 'Raw' },
          { key: 'cooked', label: 'Cooked' },
          { key: 'dry', label: 'Dry' },
          { key: 'packaged', label: 'Packaged' },
          { key: 'processed', label: 'Processed' },
        ].map(filter => (
          <button
            key={filter.key}
            type="button"
            onClick={() => handleFilterChange(filter.key)}
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

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Allowed Categories</label>
          <input
            type="text"
            value={allowedCategories}
            onChange={e => setAllowedCategories(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-xs"
            placeholder="Comma-separated categories"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Excluded Terms</label>
          <input
            type="text"
            value={excludedNameTerms}
            onChange={e => setExcludedNameTerms(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-xs"
            placeholder="Comma-separated terms"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={allowedDataTypes.foundation}
              onChange={e => setAllowedDataTypes(prev => ({ ...prev, foundation: e.target.checked }))}
            />
            Foundation
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={allowedDataTypes.srLegacy}
              onChange={e => setAllowedDataTypes(prev => ({ ...prev, srLegacy: e.target.checked }))}
            />
            SR Legacy
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            Form:
            <select
              value={formFilter}
              onChange={e => setFormFilter(e.target.value as 'all' | 'raw' | 'dry' | 'cooked' | 'processed')}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
            >
              <option value="all">All</option>
              <option value="raw">Raw</option>
              <option value="dry">Dry</option>
              <option value="cooked">Cooked</option>
              <option value="processed">Processed</option>
            </select>
          </label>
        </div>
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
          <p className="text-xs mt-2">Try a different search term</p>
        </div>
      )}

      {/* Initial State */}
      {!isLoading && !searchQuery && results.length === 0 && (
        <div className="text-center py-6 text-zinc-400">
          <p className="text-sm">Start typing to search for ingredients</p>
          <p className="text-xs mt-2">Powered by USDA FoodData Central</p>
        </div>
      )}
    </div>
  );
}
