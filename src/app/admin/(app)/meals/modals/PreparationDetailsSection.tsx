// components/admin/meals/PreparationDetailsSection.tsx
type AddMealFormData = {
  prepTime: string;
  cookTime: string;
  servings: string;
};

type AddMealErrors = Record<string, string>;

interface PreparationDetailsSectionProps {
  formData: AddMealFormData;
  errors: AddMealErrors;
  handleInputChange: (field: keyof AddMealFormData, value: string) => void;
}

import { AddMealSection } from './AddMealSection';

export function PreparationDetailsSection({ formData, errors, handleInputChange }: PreparationDetailsSectionProps) {
  return (
    <AddMealSection title="Preparation Details" description="Add timing and serving information.">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Prep Time (minutes) *</label>
          <input
            type="number"
            value={formData.prepTime}
            onChange={e => handleInputChange('prepTime', e.target.value)}
            className={`input-base w-full ${errors.prepTime ? 'border-red-500 focus:ring-red-500/20' : ''}`}
            placeholder="15"
          />
          {errors.prepTime && <p className="mt-2 text-xs text-red-400">{errors.prepTime}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Cook Time (minutes) *</label>
          <input
            type="number"
            value={formData.cookTime}
            onChange={e => handleInputChange('cookTime', e.target.value)}
            className={`input-base w-full ${errors.cookTime ? 'border-red-500 focus:ring-red-500/20' : ''}`}
            placeholder="20"
          />
          {errors.cookTime && <p className="mt-2 text-xs text-red-400">{errors.cookTime}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Servings</label>
          <input
            type="number"
            value={formData.servings}
            onChange={e => handleInputChange('servings', e.target.value)}
            className="input-base w-full"
            placeholder="1"
            min="1"
          />
        </div>
      </div>
    </AddMealSection>
  );
}
