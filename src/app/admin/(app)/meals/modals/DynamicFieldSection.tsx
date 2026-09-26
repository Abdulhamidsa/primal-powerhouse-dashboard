import { XIcon } from '@phosphor-icons/react';
// components/admin/meals/DynamicFieldSection.tsx
import { AddMealSection } from './AddMealSection';

type ArrayField = 'ingredients' | 'spices' | 'instructions' | 'tags';

interface DynamicFieldSectionProps {
  title: string;
  description: string;
  buttonText: string;
  field: ArrayField;
  values: string[];
  placeholder: string;
  error?: string;
  showIndex?: boolean;
  addArrayItem: (field: ArrayField) => void;
  removeArrayItem: (field: ArrayField, index: number) => void;
  handleArrayChange: (field: ArrayField, index: number, value: string) => void;
}

export function DynamicFieldSection({
  title,
  description,
  buttonText,
  field,
  values,
  placeholder,
  error,
  showIndex = false,
  addArrayItem,
  removeArrayItem,
  handleArrayChange,
}: DynamicFieldSectionProps) {
  return (
    <AddMealSection
      title={title}
      description={description}
      action={
        <button
          type="button"
          onClick={() => addArrayItem(field)}
          className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90"
        >
          {buttonText}
        </button>
      }
    >
      <div className="space-y-3">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            {showIndex && (
              <span className="flex min-w-[44px] items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text-muted)]">
                {index + 1}
              </span>
            )}

            <input
              type="text"
              value={value}
              onChange={e => handleArrayChange(field, index, e.target.value)}
              className="input-base flex-1"
              placeholder={placeholder}
            />

            {values.length > 1 && (
              <button
                type="button"
                onClick={() => removeArrayItem(field, index)}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-red-400 transition-colors hover:bg-red-500/10"
              >
                <XIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </AddMealSection>
  );
}
