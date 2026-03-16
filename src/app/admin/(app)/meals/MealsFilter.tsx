import React from 'react';
import { Button } from '@/components/ui/button';

type MealFilterType = 'ALL' | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

type MealFiltersProps = {
  mealTypes: MealFilterType[];
  selectedType: MealFilterType;
  onSelectType: (type: MealFilterType) => void;
};

export const MealFilters = ({ mealTypes, selectedType, onSelectType }: MealFiltersProps) => {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {mealTypes.map(type => {
          const isActive = selectedType === type;

          return (
            <Button
              key={type}
              onClick={() => onSelectType(type)}
              variant="ghost"
              className={`rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200
                ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)] border-transparent'
                    : 'bg-[var(--color-bg-alt)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface)]'
                }`}
            >
              {type === 'ALL' ? 'All Meals' : type.charAt(0) + type.slice(1).toLowerCase()}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
