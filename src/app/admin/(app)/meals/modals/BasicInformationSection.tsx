type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

type AddMealFormData = {
  name: string;
  type: MealType;
};

type AddMealErrors = Record<string, string>;

interface BasicInformationSectionProps {
  formData: AddMealFormData;
  errors: AddMealErrors;
  handleInputChange: (field: keyof AddMealFormData, value: string) => void;
}

import { AddMealSection } from './AddMealSection';

export function BasicInformationSection({ formData, errors, handleInputChange }: BasicInformationSectionProps) {
  return (
    <AddMealSection title="Basic Information" description="Set the meal name and category.">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Meal Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            className={`input-base w-full ${errors.name ? 'border-red-500 focus:ring-red-500/20' : ''}`}
            placeholder="e.g., Mediterranean Chicken Bowl"
          />
          {errors.name && <p className="mt-2 text-xs text-red-400">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">Meal Type *</label>
          <select
            value={formData.type}
            onChange={e => handleInputChange('type', e.target.value)}
            className="input-base w-full appearance-none"
          >
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
            <option value="SNACK">Snack</option>
          </select>
        </div>
      </div>
    </AddMealSection>
  );
}
