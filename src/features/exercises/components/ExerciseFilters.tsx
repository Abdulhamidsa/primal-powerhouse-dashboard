'use client';

import { useState } from 'react';
import { CaretDownIcon as ChevronDown, XIcon as X } from '@phosphor-icons/react';
import type { RapidAPIFilters } from '@/features/exercises/types/rapidapi-filters.types';

interface ExerciseFiltersProps {
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  difficulties: string[];
  selectedFilters: RapidAPIFilters;
  onFilterChange: (filters: RapidAPIFilters) => void;
  onClear: () => void;
}

interface FilterDropdownProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

function FilterDropdown({ label, options, selectedValues, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option];
    onChange(newValues);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium"
        style={{
          borderColor: 'var(--color-border)',
          color: selectedValues.length > 0 ? 'var(--color-accent)' : 'var(--color-text-primary)',
          backgroundColor: selectedValues.length > 0 ? 'var(--color-surface)' : 'transparent',
        }}
      >
        {label}
        {selectedValues.length > 0 && (
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
            style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
          >
            {selectedValues.length}
          </span>
        )}
        <ChevronDown
          aria-hidden="true"
          focusable="false"
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-64 max-h-64 overflow-y-auto rounded-lg border z-50"
          style={{ backgroundColor: 'var(--color-background)' }}
        >
          <div className="p-3 space-y-2">
            {options.map(option => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => handleToggle(option)}
                  className="w-4 h-4 rounded"
                  style={{
                    accentColor: 'var(--color-accent)',
                  }}
                />
                <span className="text-sm capitalize text-[var(--color-text-primary)]">{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExerciseFilters({
  bodyParts,
  equipments,
  targetMuscles,
  difficulties,
  selectedFilters,
  onFilterChange,
  onClear,
}: ExerciseFiltersProps) {
  const handleBodyPartsChange = (values: string[]) => {
    onFilterChange({ ...selectedFilters, bodyParts: values.length > 0 ? values : undefined });
  };

  const handleEquipmentsChange = (values: string[]) => {
    onFilterChange({ ...selectedFilters, equipments: values.length > 0 ? values : undefined });
  };

  const handleTargetMusclesChange = (values: string[]) => {
    onFilterChange({ ...selectedFilters, targetMuscles: values.length > 0 ? values : undefined });
  };

  const handleDifficultyChange = (values: string[]) => {
    onFilterChange({
      ...selectedFilters,
      difficulty: values.length > 0 ? values[0] : undefined,
    });
  };

  const hasActiveFilters =
    (selectedFilters.bodyParts && selectedFilters.bodyParts.length > 0) ||
    (selectedFilters.equipments && selectedFilters.equipments.length > 0) ||
    (selectedFilters.targetMuscles && selectedFilters.targetMuscles.length > 0) ||
    (selectedFilters.difficulty && selectedFilters.difficulty.length > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:opacity-80"
          >
            <X aria-hidden="true" focusable="false" size={12} />
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterDropdown
          label="Body Parts"
          options={bodyParts}
          selectedValues={selectedFilters.bodyParts || []}
          onChange={handleBodyPartsChange}
        />
        <FilterDropdown
          label="Equipment"
          options={equipments}
          selectedValues={selectedFilters.equipments || []}
          onChange={handleEquipmentsChange}
        />
        <FilterDropdown
          label="Muscles"
          options={targetMuscles}
          selectedValues={selectedFilters.targetMuscles || []}
          onChange={handleTargetMusclesChange}
        />
        <FilterDropdown
          label="Difficulty"
          options={difficulties}
          selectedValues={selectedFilters.difficulty ? [selectedFilters.difficulty] : []}
          onChange={handleDifficultyChange}
        />
      </div>
    </div>
  );
}
