"use client";

import { useState } from "react";
import { Meal, MealType } from "@/types/meal";

interface MealFiltersProps {
  onFilterChange: (filters: MealFilters) => void;
  totalMeals: number;
}

export interface MealFilters {
  search: string;
  type: MealType | "all";
  sortBy: "name" | "calories" | "protein" | "createdAt";
  sortOrder: "asc" | "desc";
  tags: string[];
}

export default function MealFilters({ onFilterChange, totalMeals }: MealFiltersProps) {
  const [filters, setFilters] = useState<MealFilters>({
    search: "",
    type: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
    tags: [],
  });

  const updateFilters = (newFilters: Partial<MealFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearFilters = () => {
    const defaultFilters: MealFilters = {
      search: "",
      type: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
      tags: [],
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = filters.search || filters.type !== "all" || filters.tags.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Filter & Search</h2>
          <p className="text-sm text-gray-500">
            {totalMeals} meal{totalMeals !== 1 ? "s" : ""} total
          </p>
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search meals</label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Meal Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Meal type</label>
          <select value={filters.type} onChange={(e) => updateFilters({ type: e.target.value as MealType | "all" })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            <option value="all">All meals</option>
            <option value="breakfast">🌅 Breakfast</option>
            <option value="lunch">☀️ Lunch</option>
            <option value="dinner">🌙 Dinner</option>
            <option value="snack">🍎 Snack</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
          <select value={filters.sortBy} onChange={(e) => updateFilters({ sortBy: e.target.value as MealFilters["sortBy"] })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            <option value="createdAt">Date created</option>
            <option value="name">Name (A-Z)</option>
            <option value="calories">Calories</option>
            <option value="protein">Protein</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
          <select value={filters.sortOrder} onChange={(e) => updateFilters({ sortOrder: e.target.value as "asc" | "desc" })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            <option value="desc">{filters.sortBy === "name" ? "Z to A" : "High to Low"}</option>
            <option value="asc">{filters.sortBy === "name" ? "A to Z" : "Low to High"}</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Tags */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Quick filters</label>
        <div className="flex flex-wrap gap-2">
          {["vegetarian", "vegan", "gluten-free", "dairy-free", "low-carb", "high-protein", "keto", "paleo"].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                const newTags = filters.tags.includes(tag) ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag];
                updateFilters({ tags: newTags });
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filters.tags.includes(tag) ? "bg-blue-100 text-blue-700 border border-blue-300" : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
