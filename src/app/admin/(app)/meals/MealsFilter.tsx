import React from 'react';
import {
  ClockIcon as Clock,
  FlameIcon as Flame,
  ImageIcon as ImageIcon,
  LeafIcon as Leaf,
  MagnifyingGlassIcon as Search,
  SlidersHorizontalIcon as SlidersHorizontal,
  BarbellIcon,
  XIcon as X,
} from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';
import { MealFilterType } from '@/lib/meal-planner/types';

export type MealSortOption = 'newest' | 'name' | 'caloriesAsc' | 'caloriesDesc' | 'proteinDesc' | 'prepTimeAsc';

export type MealSmartFilter = 'highProtein' | 'lowCalorie' | 'quick' | 'hasImage' | 'missingImage';

type MealFiltersProps = {
  mealTypes: MealFilterType[];
  selectedType: MealFilterType;
  onSelectType: (type: MealFilterType) => void;
  mealCounts: Record<MealFilterType, number>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: MealSortOption;
  onSortChange: (value: MealSortOption) => void;
  activeSmartFilters: MealSmartFilter[];
  onToggleSmartFilter: (filter: MealSmartFilter) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

const sortOptions: Array<{ value: MealSortOption; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'caloriesAsc', label: 'Calories low-high' },
  { value: 'caloriesDesc', label: 'Calories high-low' },
  { value: 'proteinDesc', label: 'Protein high-low' },
  { value: 'prepTimeAsc', label: 'Prep time' },
];

const smartFilters: Array<{ value: MealSmartFilter; label: string; helper: string; icon: React.ElementType }> = [
  { value: 'highProtein', label: 'High protein', helper: '30g+', icon: BarbellIcon },
  { value: 'lowCalorie', label: 'Low calorie', helper: '≤500 kcal', icon: Flame },
  { value: 'quick', label: 'Quick', helper: '≤25 min', icon: Clock },
  { value: 'hasImage', label: 'Has image', helper: 'ready cards', icon: ImageIcon },
  { value: 'missingImage', label: 'Missing image', helper: 'needs media', icon: ImageIcon },
];

const formatMealType = (type: MealFilterType) => {
  if (type === 'ALL') return 'All meals';
  if (type === 'SIDES') return 'Sides';
  return type.charAt(0) + type.slice(1).toLowerCase();
};

export const MealFilters = ({
  activeSmartFilters,
  hasActiveFilters,
  mealCounts,
  mealTypes,
  onClearFilters,
  onSearchChange,
  onSelectType,
  onSortChange,
  onToggleSmartFilter,
  searchQuery,
  selectedType,
  sortBy,
}: MealFiltersProps) => {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            focusable="false"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={searchQuery}
            onChange={event => onSearchChange(event.target.value)}
            placeholder="Search meals, ingredients, or tags..."
            className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--color-accent)]/50 focus:bg-black/30"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex h-11 min-w-[220px] items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 text-sm text-muted-foreground">
            <SlidersHorizontal aria-hidden="true" focusable="false" className="h-4 w-4 text-[var(--color-accent)]" />
            <span className="shrink-0">Sort</span>
            <select
              value={sortBy}
              onChange={event => onSortChange(event.target.value as MealSortOption)}
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-zinc-950 text-zinc-100">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onClearFilters}
              className="h-11 rounded-2xl border border-white/10 px-4 text-sm text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            >
              <X aria-hidden="true" focusable="false" className="mr-2 h-4 w-4" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {mealTypes.map(type => {
          const isActive = selectedType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelectType(type)}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all',
                isActive
                  ? 'border-[var(--color-accent)]/45 bg-[var(--color-accent)] text-[var(--color-text-on-accent)] shadow-[0_14px_34px_rgba(0,0,0,0.22)]'
                  : 'border-white/10 bg-white/[0.04] text-muted-foreground hover:border-white/15 hover:bg-white/[0.07] hover:text-foreground',
              ].join(' ')}
            >
              {type === 'SIDES' ? <Leaf aria-hidden="true" focusable="false" size={14} /> : null}
              {formatMealType(type)}
              <span
                className={[
                  'rounded-full px-1.5 py-0.5 text-[11px]',
                  isActive ? 'bg-black/15' : 'bg-black/20 text-muted-foreground',
                ].join(' ')}
              >
                {mealCounts[type] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {smartFilters.map(filter => {
          const Icon = filter.icon;
          const isActive = activeSmartFilters.includes(filter.value);
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onToggleSmartFilter(filter.value)}
              className={[
                'flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors',
                isActive
                  ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent-translucent)] text-foreground'
                  : 'border-white/10 bg-black/15 text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
              ].join(' ')}
            >
              <span
                className={[
                  'grid h-9 w-9 shrink-0 place-items-center rounded-xl border',
                  isActive
                    ? 'border-[var(--color-accent)]/35 bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                    : 'border-white/10 bg-white/[0.04] text-muted-foreground',
                ].join(' ')}
              >
                <Icon aria-hidden="true" focusable="false" size={16} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{filter.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{filter.helper}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
