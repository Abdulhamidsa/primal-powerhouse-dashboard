'use client';

import { useMemo, useState } from 'react';
import FoodForm from '@/features/foods/components/FoodForm';
import { useFoods } from '@/features/foods/hooks/useFoods';
import type { FoodCategory } from '@/features/foods/types/food.types';

const categoryOptions: Array<FoodCategory | 'all'> = ['all', 'protein', 'carb', 'fat', 'dairy', 'fruit', 'vegetable', 'extra'];

export default function IngredientsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FoodCategory | 'all'>('all');
  const [showForm, setShowForm] = useState(false);

  const params = useMemo(
    () => ({
      q: query.trim() || undefined,
      category: category === 'all' ? undefined : category,
      isActive: true,
      limit: 100,
    }),
    [query, category]
  );

  const { items, total, isLoading, error, refresh } = useFoods(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Ingredients</h1>
          <p className="text-sm text-zinc-400">Add and manage your internal ingredient catalog used by meal building.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Add Ingredient
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-xs font-medium text-zinc-400">Search</label>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or unit label"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as FoodCategory | 'all')}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
          >
            {categoryOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <p className="text-sm text-zinc-300">{isLoading ? 'Loading ingredients...' : `${total} ingredient${total === 1 ? '' : 's'}`}</p>
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="p-4 text-sm text-red-300">Failed to load ingredients: {error.message}</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-zinc-400">No ingredients found for current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-800/80 text-zinc-300">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">State</th>
                  <th className="px-4 py-2 text-left">Unit</th>
                  <th className="px-4 py-2 text-left">kcal</th>
                  <th className="px-4 py-2 text-left">Protein</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-t border-zinc-800 text-zinc-200">
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2">{item.category}</td>
                    <td className="px-4 py-2">{item.state}</td>
                    <td className="px-4 py-2">
                      {item.baseUnit}
                      {item.baseUnit === 'unit' && item.gramsPerUnit ? ` (${item.gramsPerUnit}g ${item.displayUnitLabel || 'unit'})` : ''}
                    </td>
                    <td className="px-4 py-2">{item.caloriesKcal}</td>
                    <td className="px-4 py-2">{item.proteinG}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FoodForm isOpen={showForm} onCloseAction={() => setShowForm(false)} onCreatedAction={refresh} />
    </div>
  );
}
