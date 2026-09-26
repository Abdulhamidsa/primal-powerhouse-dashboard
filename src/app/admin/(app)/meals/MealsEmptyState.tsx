import React from 'react';
import { ForkKnifeIcon as Utensils } from '@phosphor-icons/react/ssr';

type MealsEmptyStateProps = {
  selectedType: string;
  hasActiveFilters: boolean;
};

export const MealsEmptyState = ({ hasActiveFilters, selectedType }: MealsEmptyStateProps) => {
  const message = hasActiveFilters
    ? 'No library items match the current search and filters. Clear filters or adjust the search to widen the result set.'
    : selectedType === 'ALL'
      ? 'No meals have been added yet. Create a manual meal or use the meal builder to start the library.'
      : `No ${selectedType.toLowerCase()} items found yet.`;

  return (
    <div className="rounded-[22px] border border-dashed border-white/12 bg-black/15 px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-muted-foreground">
        <Utensils aria-hidden="true" focusable="false" size={24} />
      </div>

      <h3 className="mb-2 text-lg font-semibold text-foreground">No meals found</h3>

      <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">{message}</p>
    </div>
  );
};
