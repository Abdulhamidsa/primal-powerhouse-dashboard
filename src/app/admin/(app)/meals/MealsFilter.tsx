import React from 'react';
import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';

type MealFilterType = 'ALL' | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'SIDES';

type MealFiltersProps = {
  mealTypes: MealFilterType[];
  selectedType: MealFilterType;
  onSelectType: (type: MealFilterType) => void;
  mealCounts: Record<MealFilterType, number>;
};

export const MealFilters = ({ mealTypes, selectedType, onSelectType, mealCounts }: MealFiltersProps) => {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {mealTypes.map(type => {
          const isActive = selectedType === type;

          return (
            <React.Fragment key={type}>
              <Button
                onClick={() => onSelectType(type)}
                variant="ghost"
                className={`rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200
                ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)] border-transparent'
                    : 'bg-[var(--color-bg-alt)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface)]'
                }`}
              >
                {type === 'SIDES' ? (
                  <>
                    <Leaf size={14} className="inline mr-1" />
                    Sides
                  </>
                ) : type === 'ALL' ? (
                  'All Meals'
                ) : (
                  type.charAt(0) + type.slice(1).toLowerCase()
                )}{' '}
                ({mealCounts[type] ?? 0})
              </Button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
