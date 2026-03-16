import React from 'react';
import { Utensils } from 'lucide-react';

type MealsEmptyStateProps = {
  selectedType: string;
};

export const MealsEmptyState = ({ selectedType }: MealsEmptyStateProps) => {
  return (
    <div className="text-center py-16">
      <div className="mb-4">
        <Utensils size={48} style={{ margin: '0 auto', color: 'var(--color-text-muted)' }} />
      </div>

      <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        No meals found
      </h3>

      <p style={{ color: 'var(--color-text-muted)' }}>
        {selectedType === 'ALL' ? 'No meals have been added yet.' : `No ${selectedType.toLowerCase()} meals found.`}
      </p>
    </div>
  );
};
