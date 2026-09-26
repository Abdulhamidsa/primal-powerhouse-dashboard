'use client';


import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { MealType } from '@/types/meal';

interface MealFiltersProps {
  onFilterChangeAction: (filters: MealFilters) => void;
  totalMeals: number;
}

export interface MealFilters {
  search: string;
  type: MealType | 'all';
  sortBy: 'name' | 'calories' | 'protein' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  tags: string[];
}

export default function MealFilters({ onFilterChangeAction, totalMeals }: MealFiltersProps) {
  const [filters, setFilters] = useState<MealFilters>({
    search: '',
    type: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    tags: [],
  });

  const updateFilters = (newFilters: Partial<MealFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChangeAction(updatedFilters);
  };

  const clearFilters = () => {
    const defaultFilters: MealFilters = {
      search: '',
      type: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      tags: [],
    };
    setFilters(defaultFilters);
    onFilterChangeAction(defaultFilters);
  };

  const hasActiveFilters = filters.search || filters.type !== 'all' || filters.tags.length > 0;

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Filter & Search</h2>
          <p className="text-sm text-zinc-400">
            {totalMeals} meal{totalMeals !== 1 ? 's' : ''} total
          </p>
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-400 font-medium">
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Search meals</label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={e => updateFilters({ search: e.target.value })}
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" aria-hidden="true" focusable="false" />
          </div>
        </div>

        {/* Meal Type Filter */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Meal type</label>
          <select
            value={filters.type}
            onChange={e => updateFilters({ type: e.target.value as MealType | 'all' })}
            className="w-full px-3 py-2 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          >
            <option value="all">All meals</option>
            <option value="breakfast">🌅 Breakfast</option>
            <option value="lunch">☀️ Lunch</option>
            <option value="dinner">🌙 Dinner</option>
            <option value="snack">🍎 Snack</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Sort by</label>
          <select
            value={filters.sortBy}
            onChange={e => updateFilters({ sortBy: e.target.value as MealFilters['sortBy'] })}
            className="w-full px-3 py-2 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          >
            <option value="createdAt">Date created</option>
            <option value="name">Name (A-Z)</option>
            <option value="calories">Calories</option>
            <option value="protein">Protein</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Order</label>
          <select
            value={filters.sortOrder}
            onChange={e => updateFilters({ sortOrder: e.target.value as 'asc' | 'desc' })}
            className="w-full px-3 py-2 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          >
            <option value="desc">{filters.sortBy === 'name' ? 'Z to A' : 'High to Low'}</option>
            <option value="asc">{filters.sortBy === 'name' ? 'A to Z' : 'Low to High'}</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Tags */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-zinc-300 mb-3">Quick filters</label>
        <div className="flex flex-wrap gap-2">
          {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'low-carb', 'high-protein', 'keto', 'paleo'].map(
            tag => (
              <button
                key={tag}
                onClick={() => {
                  const newTags = filters.tags.includes(tag)
                    ? filters.tags.filter(t => t !== tag)
                    : [...filters.tags, tag];
                  updateFilters({ tags: newTags });
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filters.tags.includes(tag) ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'}`}
              >
                {tag}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
