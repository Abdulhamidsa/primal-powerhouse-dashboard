// components/admin/meals/NutritionInformationSection.tsx
type AddMealFormData = {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
};

type AddMealErrors = Record<string, string>;

interface NutritionInformationSectionProps {
  formData: AddMealFormData;
  errors: AddMealErrors;
  handleInputChange: (field: keyof AddMealFormData, value: string) => void;
}

import { AddMealSection } from './AddMealSection';

export function NutritionInformationSection({ formData, errors, handleInputChange }: NutritionInformationSectionProps) {
  return (
    <AddMealSection title="Nutrition Information" description="Add the main nutrition values for this meal.">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Calories *</label>
          <input
            type="number"
            value={formData.calories}
            onChange={e => handleInputChange('calories', e.target.value)}
            className={`input-base w-full ${errors.calories ? 'border-red-500 focus:ring-red-500/20' : ''}`}
            placeholder="450"
          />
          {errors.calories && <p className="mt-2 text-xs text-red-400">{errors.calories}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Protein (g) *</label>
          <input
            type="number"
            value={formData.protein}
            onChange={e => handleInputChange('protein', e.target.value)}
            className={`input-base w-full ${errors.protein ? 'border-red-500 focus:ring-red-500/20' : ''}`}
            placeholder="25"
          />
          {errors.protein && <p className="mt-2 text-xs text-red-400">{errors.protein}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Carbs (g) *</label>
          <input
            type="number"
            value={formData.carbs}
            onChange={e => handleInputChange('carbs', e.target.value)}
            className={`input-base w-full ${errors.carbs ? 'border-red-500 focus:ring-red-500/20' : ''}`}
            placeholder="30"
          />
          {errors.carbs && <p className="mt-2 text-xs text-red-400">{errors.carbs}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Fat (g) *</label>
          <input
            type="number"
            value={formData.fat}
            onChange={e => handleInputChange('fat', e.target.value)}
            className={`input-base w-full ${errors.fat ? 'border-red-500 focus:ring-red-500/20' : ''}`}
            placeholder="15"
          />
          {errors.fat && <p className="mt-2 text-xs text-red-400">{errors.fat}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Fiber (g)</label>
          <input
            type="number"
            value={formData.fiber}
            onChange={e => handleInputChange('fiber', e.target.value)}
            className="input-base w-full"
            placeholder="8"
          />
        </div>
      </div>
    </AddMealSection>
  );
}
