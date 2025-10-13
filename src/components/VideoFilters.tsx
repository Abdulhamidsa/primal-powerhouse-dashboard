'use client';

import { VideoCategory, DifficultyLevel, VIDEO_CATEGORIES, DIFFICULTY_LEVELS } from '@/types/video';

interface VideoFiltersProps {
  filters: {
    category: VideoCategory | 'all';
    difficulty: DifficultyLevel | 'all';
    search: string;
  };
  onFiltersChange: (filters: any) => void;
  videosCount: number;
}

export default function VideoFilters({ filters, onFiltersChange, videosCount }: VideoFiltersProps) {
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      category: 'all',
      difficulty: 'all',
      search: '',
    });
  };

  const hasActiveFilters =
    filters.category !== 'all' || filters.difficulty !== 'all' || filters.search !== '';

  return (
    <div className="bg-gradient-to-r from-white via-gray-50 to-white rounded-2xl shadow-sm border p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search training videos..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm"
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="min-w-[180px]">
          <select
            value={filters.category}
            onChange={e => handleFilterChange('category', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm font-medium"
          >
            <option value="all">🏃 All Categories</option>
            {VIDEO_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="min-w-[160px]">
          <select
            value={filters.difficulty}
            onChange={e => handleFilterChange('difficulty', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm font-medium"
          >
            <option value="all">💪 All Levels</option>
            {DIFFICULTY_LEVELS.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 font-medium shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Clear All
          </button>
        )}
      </div>

      {/* Results Count & Active Filters */}
      <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-700">
            {videosCount} video{videosCount !== 1 ? 's' : ''} found
          </span>
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <>
            <span className="text-gray-300">•</span>
            <div className="flex flex-wrap items-center gap-2">
              {filters.search && (
                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm px-3 py-1.5 rounded-full font-medium">
                  🔍 "{filters.search}"
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              )}

              {filters.category !== 'all' && (
                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-sm px-3 py-1.5 rounded-full font-medium">
                  🏃 {VIDEO_CATEGORIES.find(c => c.value === filters.category)?.label}
                  <button
                    onClick={() => handleFilterChange('category', 'all')}
                    className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              )}

              {filters.difficulty !== 'all' && (
                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-sm px-3 py-1.5 rounded-full font-medium">
                  💪 {DIFFICULTY_LEVELS.find(d => d.value === filters.difficulty)?.label}
                  <button
                    onClick={() => handleFilterChange('difficulty', 'all')}
                    className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
