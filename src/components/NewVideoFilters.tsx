'use client';

import { VideoCategory, DifficultyLevel, VIDEO_CATEGORIES, DIFFICULTY_LEVELS } from '@/types/video';
import { Search, Filter, X, Video } from 'lucide-react';

interface VideoFiltersProps {
  filters: {
    category: VideoCategory | 'all';
    difficulty: DifficultyLevel | 'all';
    search: string;
  };
  onFiltersChange: (filters: any) => void;
  videosCount: number;
}

export default function NewVideoFilters({
  filters,
  onFiltersChange,
  videosCount,
}: VideoFiltersProps) {
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
    <div
      className="rounded-xl shadow-sm border p-6 mb-8"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search training videos..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="w-full pl-12 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="min-w-[180px]">
          <select
            value={filters.category}
            onChange={e => handleFilterChange('category', e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
            style={{
              background: 'var(--color-bg-alt)',
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)',
            }}
          >
            <option value="all">All Categories</option>
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
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-opacity-50 focus:ring-red-500 focus:border-transparent"
            style={{
              background: 'var(--color-bg-alt)',
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)',
            }}
          >
            <option value="all">All Levels</option>
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
            className="px-6 py-3 rounded-lg flex items-center gap-2"
            style={{
              background: 'var(--color-bg-alt)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Results Count & Active Filters */}
      {(videosCount > 0 || hasActiveFilters) && (
        <div
          className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>
              {videosCount} video{videosCount !== 1 ? 's' : ''} found
            </span>
          </div>

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <>
              <span style={{ color: 'var(--color-border)' }}>•</span>
              <div className="flex flex-wrap items-center gap-2">
                {filters.search && (
                  <span
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs"
                    style={{
                      background: 'var(--color-accent-muted)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    "{filters.search}"
                    <button
                      onClick={() => handleFilterChange('search', '')}
                      className="rounded-full p-0.5"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.category !== 'all' && (
                  <span
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs"
                    style={{
                      background: 'var(--color-accent-muted)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {VIDEO_CATEGORIES.find(c => c.value === filters.category)?.label}
                    <button
                      onClick={() => handleFilterChange('category', 'all')}
                      className="rounded-full p-0.5"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.difficulty !== 'all' && (
                  <span
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs"
                    style={{
                      background: 'var(--color-accent-muted)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {DIFFICULTY_LEVELS.find(d => d.value === filters.difficulty)?.label}
                    <button
                      onClick={() => handleFilterChange('difficulty', 'all')}
                      className="rounded-full p-0.5"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
