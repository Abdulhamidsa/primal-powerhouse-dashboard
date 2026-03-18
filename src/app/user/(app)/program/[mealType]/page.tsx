'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft } from 'lucide-react';
import { SkeletonMealGrid } from '@/components/Skeletons';
import { MealOptionCard } from '@/features/meals/components/MealOptionCard';
import { useMealSelectionPlanner } from '@/features/meals/hooks/useMealSelectionPlanner';
import type { MealTypeKey } from '@/features/meals/types/mealSelection.types';
import type { ApiError } from '@/lib/request';
import type { MealAssignment } from '@/app/user/(app)/meals';

const TYPE_MAP: Record<string, MealTypeKey> = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
  snack: 'SNACK',
};

const TYPE_TITLE: Record<MealTypeKey, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snacks',
};

export default function ProgramMealTypePage() {
  const params = useParams();
  const router = useRouter();

  const mealTypeParam = typeof params?.mealType === 'string' ? params.mealType : '';
  const mealType = TYPE_MAP[mealTypeParam.toLowerCase()];

  const allMealsSWR = useSWR<MealAssignment[], ApiError>('/api/user/meals');

  const {
    saveError,
    snackMax,
    snackCount,
    isSnackFull,
    isSelected,
    selectOption,
    saveDraft,
    hasChanges,
    isSaving,
  } = useMealSelectionPlanner();

  const options = useMemo(() => {
    if (!mealType || !allMealsSWR.data) return [];

    return allMealsSWR.data
      .filter(assignment => assignment.mealType?.toUpperCase() === mealType)
      .map(assignment => ({
        sourceAssignmentId: assignment.id,
        mealType,
        portion: assignment.portion || 1,
        scheduledTime: assignment.scheduledTime ?? null,
        meal: {
          id: assignment.meal.id,
          name: assignment.meal.name,
          type: assignment.mealType,
          calories: assignment.meal.calories,
          protein: assignment.meal.protein,
          carbs: assignment.meal.carbs,
          fat: assignment.meal.fat,
          imageUrl: assignment.meal.imageUrl ?? null,
          prepTime: assignment.meal.prepTime ?? null,
          cookTime: assignment.meal.cookTime ?? null,
          servings: assignment.meal.servings ?? 1,
        },
      }));
  }, [mealType, allMealsSWR.data]);

  const loading = allMealsSWR.isLoading;
  const error = allMealsSWR.error;

  if (!mealType) {
    return (
      <div className="px-4 py-6 md:px-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <button
            type="button"
            onClick={() => router.push('/user/program')}
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]"
          >
            <ArrowLeft size={16} />
            Back to Program
          </button>
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <p className="text-sm text-[var(--color-text-muted)]">Unknown meal type.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6">
      <div className="mx-auto max-w-6xl space-y-5 pb-24">
        <button
          type="button"
          onClick={() => router.push('/user/program')}
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]"
        >
          <ArrowLeft size={16} />
          Back to Program
        </button>

        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">{TYPE_TITLE[mealType]}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {mealType === 'SNACK'
              ? `Select up to ${snackMax} snacks.`
              : `Select one ${TYPE_TITLE[mealType].toLowerCase()} option.`}
          </p>
          {mealType === 'SNACK' ? (
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Selected snacks: {snackCount}/{snackMax}
            </p>
          ) : null}
        </section>

        {loading ? <SkeletonMealGrid /> : null}

        {error ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-accent)]">
            Failed to load meal options: {error.message}
          </div>
        ) : null}

        {saveError ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-accent)]">
            {saveError.message}
          </div>
        ) : null}

        {!loading && !error && options.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            No options available for this meal type yet.
          </div>
        ) : null}

        {options.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {options.map(option => (
              <MealOptionCard
                key={option.sourceAssignmentId}
                option={option}
                selected={isSelected(option.mealType, option.meal.id)}
                onSelect={() => selectOption(option)}
                disabled={mealType === 'SNACK' && !isSelected('SNACK', option.meal.id) && isSnackFull}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-24 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 p-3 backdrop-blur sm:px-6 lg:bottom-0">
        <div className="mx-auto flex w-full max-w-6xl justify-end">
          <button
            type="button"
            onClick={saveDraft}
            disabled={!hasChanges || isSaving}
            className="rounded-2xl bg-[var(--color-accent-translucent)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Selection'}
          </button>
        </div>
      </div>
    </div>
  );
}
