'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, Clock3, X } from 'lucide-react';
import { SkeletonMealGrid } from '@/components/Skeletons';
import { MealOptionCard } from '@/features/meals/components/MealOptionCard';
import { useMealSelectionPlanner } from '@/features/meals/hooks/useMealSelectionPlanner';
import type { MealTypeKey } from '@/features/meals/types/mealSelection.types';
import type { ApiError } from '@/lib/request';
import type { MealAssignment } from '@/app/user/(app)/meals';

const fallbackImage =
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=60';

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
  const [previewMeal, setPreviewMeal] = useState<MealAssignment['meal'] | null>(null);

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

  const mealLookup = useMemo(() => {
    const byId: Record<string, MealAssignment['meal']> = {};

    (allMealsSWR.data ?? []).forEach(assignment => {
      byId[assignment.meal.id] = assignment.meal;
    });

    return byId;
  }, [allMealsSWR.data]);

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
                onPreview={() => setPreviewMeal(mealLookup[option.meal.id] ?? null)}
                disabled={mealType === 'SNACK' && !isSelected('SNACK', option.meal.id) && isSnackFull}
              />
            ))}
          </div>
        ) : null}
      </div>

      {previewMeal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4" onClick={() => setPreviewMeal(null)}>
          <section
            className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]"
            onClick={event => event.stopPropagation()}
          >
            <div className="relative h-52 w-full">
              <Image
                src={previewMeal.imageUrl?.trim() ? previewMeal.imageUrl : fallbackImage}
                alt={previewMeal.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 560px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <button
                type="button"
                onClick={() => setPreviewMeal(null)}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur"
                aria-label="Close preview"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-3 left-3 right-3">
                <h2 className="text-lg font-semibold text-white">{previewMeal.name}</h2>
                <p className="mt-1 text-xs text-white/85">
                  {previewMeal.calories} kcal • P {previewMeal.protein}g • C {previewMeal.carbs}g • F {previewMeal.fat}g
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                {(previewMeal.prepTime ?? 0) + (previewMeal.cookTime ?? 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-2.5 py-1">
                    <Clock3 size={12} />
                    {(previewMeal.prepTime ?? 0) + (previewMeal.cookTime ?? 0)} min
                  </span>
                ) : null}
                {previewMeal.category ? (
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-2.5 py-1">
                    {previewMeal.category}
                  </span>
                ) : null}
                {previewMeal.difficulty ? (
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-2.5 py-1">
                    {previewMeal.difficulty}
                  </span>
                ) : null}
              </div>

              {previewMeal.description ? (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">About</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{previewMeal.description}</p>
                </div>
              ) : null}

              {previewMeal.ingredients ? (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Ingredients</h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-[var(--color-text-muted)]">{previewMeal.ingredients}</p>
                </div>
              ) : null}

              {previewMeal.instructions ? (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Instructions</h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-[var(--color-text-muted)]">{previewMeal.instructions}</p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

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
