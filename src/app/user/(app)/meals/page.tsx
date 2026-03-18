'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, Undo2 } from 'lucide-react';
import { SkeletonMealGrid } from '@/components/Skeletons';
import { MealOptionCard } from '@/features/meals/components/MealOptionCard';
import { MealSelectionSummaryCard } from '@/features/meals/components/MealSelectionSummaryCard';
import { useMealSelectionPlanner } from '@/features/meals/hooks/useMealSelectionPlanner';
import type { MealTypeKey } from '@/features/meals/types/mealSelection.types';

const MEAL_FILTERS: Array<{ key: 'ALL' | MealTypeKey; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'BREAKFAST', label: 'Breakfast' },
  { key: 'LUNCH', label: 'Lunch' },
  { key: 'DINNER', label: 'Dinner' },
  { key: 'SNACK', label: 'Snacks' },
];

export default function UserMealsPage() {
  const router = useRouter();
  const {
    loading,
    error,
    saveError,
    optionsByType,
    selectedByType,
    selectedTotals,
    baselineTotals,
    delta,
    snackCount,
    snackMax,
    isSnackFull,
    hasRequiredSlots,
    hasChanges,
    isSaving,
    selectOption,
    isSelected,
    saveDraft,
    resetDraftToSaved,
  } = useMealSelectionPlanner();

  const [activeFilter, setActiveFilter] = useState<'ALL' | MealTypeKey>('ALL');

  const filteredOptions = useMemo(() => {
    if (!optionsByType) return [];
    if (activeFilter === 'ALL') {
      return [...optionsByType.BREAKFAST, ...optionsByType.LUNCH, ...optionsByType.DINNER, ...optionsByType.SNACK];
    }

    return optionsByType[activeFilter] ?? [];
  }, [optionsByType, activeFilter]);

  return (
    <div className="px-4 py-6 md:px-6">
      <div className="mx-auto max-w-6xl space-y-5 pb-24">
        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">My Meals</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Assign your current meal set and save when ready.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-4">
            <SlotState label="Breakfast" count={selectedByType.BREAKFAST.length} max={1} required />
            <SlotState label="Lunch" count={selectedByType.LUNCH.length} max={1} required />
            <SlotState label="Dinner" count={selectedByType.DINNER.length} max={1} required />
            <SlotState label="Snacks" count={snackCount} max={snackMax} />
          </div>
        </section>

        <MealSelectionSummaryCard selected={selectedTotals} baseline={baselineTotals} delta={delta} />

        <section className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MEAL_FILTERS.map(filter => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={[
                  'shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all',
                  activeFilter === filter.key
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-translucent)] text-[var(--color-text)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-muted)] hover:text-[var(--color-text)]',
                ].join(' ')}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loading ? <SkeletonMealGrid /> : null}

          {error ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
              <p className="text-sm text-[var(--color-accent)]">Failed to load meal options: {error.message}</p>
            </div>
          ) : null}

          {saveError ? (
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-sm text-[var(--color-accent)]">
              <AlertCircle size={16} />
              <span>{saveError.message}</span>
            </div>
          ) : null}

          {!loading && !error && filteredOptions.length === 0 ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">No meals available for this filter yet.</p>
            </div>
          ) : null}

          {filteredOptions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOptions.map(option => (
                <div key={`${option.mealType}_${option.meal.id}`} className="space-y-2">
                  <MealOptionCard
                    option={option}
                    selected={isSelected(option.mealType, option.meal.id)}
                    onSelect={() => selectOption(option)}
                    disabled={option.mealType === 'SNACK' && !isSelected('SNACK', option.meal.id) && isSnackFull}
                  />
                  <button
                    type="button"
                    onClick={() => router.push(`/user/meals/${option.meal.id}`)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  >
                    Open meal details
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-base font-semibold text-[var(--color-text)]">My Current Selection</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(['BREAKFAST', 'LUNCH', 'DINNER'] as const).map(type => {
              const item = selectedByType[type][0];
              return (
                <SelectionRow
                  key={type}
                  label={type}
                  value={item ? item.meal.name : 'Not selected'}
                  muted={!item}
                />
              );
            })}

            <SelectionRow
              label="SNACKS"
              value={selectedByType.SNACK.length > 0 ? selectedByType.SNACK.map(item => item.meal.name).join(', ') : 'No snack selected'}
              muted={selectedByType.SNACK.length === 0}
            />
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-24 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 p-3 backdrop-blur sm:px-6 lg:bottom-0">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={resetDraftToSaved}
            disabled={!hasChanges || isSaving}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-muted)] disabled:opacity-60"
          >
            <Undo2 size={14} />
            Reset
          </button>

          <button
            type="button"
            onClick={saveDraft}
            disabled={!hasChanges || isSaving}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent-translucent)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-60"
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : 'Save Selection'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SlotState({
  label,
  count,
  max,
  required,
}: {
  label: string;
  count: number;
  max: number;
  required?: boolean;
}) {
  const isMet = required ? count === max : count <= max;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
        {count}/{max}
      </p>
      <p className={[`text-xs ${isMet ? 'text-emerald-600' : 'text-[var(--color-accent)]'}`].join(' ')}>
        {isMet ? 'Ready' : required ? 'Required' : 'Optional'}
      </p>
    </div>
  );
}

function SelectionRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      <p className={['mt-1 text-sm', muted ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'].join(' ')}>{value}</p>
    </div>
  );
}
