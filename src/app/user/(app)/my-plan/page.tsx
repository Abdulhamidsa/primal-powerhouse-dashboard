'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, ArrowLeft, Save, Undo2, X } from 'lucide-react';
import { SkeletonMealGrid } from '@/components/Skeletons';
import { MealOptionCard } from '@/features/meals/components/MealOptionCard';
import { MealSelectionSummaryCard } from '@/features/meals/components/MealSelectionSummaryCard';
import { useMealSelectionPlanner } from '@/features/meals/hooks/useMealSelectionPlanner';
import type { MealTypeKey } from '@/features/meals/types/mealSelection.types';

const fallbackImage =
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=60';

const TYPE_LABEL: Record<MealTypeKey, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snacks',
};

const TYPE_ORDER: MealTypeKey[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

export default function UserMyPlanPage() {
  const router = useRouter();
  const {
    loading,
    error,
    saveError,
    optionsByType,
    selectedByType,
    selectedTotals,
    coachTargetTotals,
    delta,
    isSelected,
    isSnackFull,
    hasChanges,
    isSaving,
    selectOption,
    saveDraft,
    resetDraftToSaved,
  } = useMealSelectionPlanner();

  const [swapState, setSwapState] = useState<{
    mealType: MealTypeKey;
    currentMealId: string;
    currentMealName: string;
  } | null>(null);

  const isPlanComplete =
    selectedByType.BREAKFAST.length === 1 && selectedByType.LUNCH.length === 1 && selectedByType.DINNER.length === 1;

  const orderedSections = useMemo(() => {
    return TYPE_ORDER.map(type => ({
      type,
      items: selectedByType[type],
    }));
  }, [selectedByType]);

  const swapOptions = useMemo(() => {
    if (!swapState || !optionsByType) return [];
    return optionsByType[swapState.mealType] ?? [];
  }, [optionsByType, swapState]);

  const onSwapOptionSelect = (mealType: MealTypeKey, currentMealId: string, currentMealName: string) => {
    setSwapState({ mealType, currentMealId, currentMealName });
  };

  const handleSelectReplacement = (option: (typeof swapOptions)[number]) => {
    if (!swapState) return;

    if (swapState.mealType === 'SNACK') {
      if (option.meal.id === swapState.currentMealId) {
        setSwapState(null);
        return;
      }

      const currentSnack = selectedByType.SNACK.find(item => item.meal.id === swapState.currentMealId);
      if (currentSnack) {
        selectOption({
          sourceAssignmentId: currentSnack.sourceAssignmentId ?? currentSnack.mealId,
          mealType: 'SNACK',
          portion: currentSnack.portion,
          scheduledTime: null,
          meal: currentSnack.meal,
        });
      }
    }

    selectOption(option);
    setSwapState(null);
  };

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
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Meal Plan</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Your currently selected meals: one breakfast, lunch, dinner, and up to two snacks.
          </p>
          {!isPlanComplete ? (
            <p className="mt-2 text-sm font-medium text-[var(--color-accent)]">
              Plan is not completed yet. Add breakfast, lunch, and dinner to complete it.
            </p>
          ) : (
            <p className="mt-2 text-sm font-medium text-emerald-600">Plan completed.</p>
          )}
        </section>

        <MealSelectionSummaryCard selected={selectedTotals} target={coachTargetTotals} delta={delta} subtle />

        {loading ? <SkeletonMealGrid /> : null}

        {error ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-sm text-[var(--color-accent)]">
            Failed to load your selected meals: {error.message}
          </div>
        ) : null}

        {saveError ? (
          <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-sm text-[var(--color-accent)]">
            <AlertCircle size={16} />
            <span>{saveError.message}</span>
          </div>
        ) : null}

        {!loading && !error
          ? orderedSections.map(section => (
              <section key={section.type} className="space-y-3">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">{TYPE_LABEL[section.type]}</h2>

                {section.items.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-muted)]">
                    No {TYPE_LABEL[section.type].toLowerCase()} selected.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map(item => (
                      <article
                        key={`${item.mealType}_${item.slotIndex}_${item.mealId}`}
                        className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
                      >
                        <div className="relative h-32 w-full">
                          <Image
                            src={item.meal.imageUrl?.trim() ? item.meal.imageUrl : fallbackImage}
                            alt={item.meal.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
                        </div>

                        <div className="p-4">
                          <p className="text-sm font-semibold text-[var(--color-text)]">{item.meal.name}</p>
                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {item.meal.calories} kcal • P {item.meal.protein}g • C {item.meal.carbs}g • F {item.meal.fat}g
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSwapOptionSelect(section.type, item.meal.id, item.meal.name)}
                              className="rounded-xl bg-[var(--color-accent-translucent)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)]"
                            >
                              Swap
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push(`/user/meals/${item.meal.id}`)}
                              className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                            >
                              Open details
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))
          : null}
      </div>

      {swapState ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4" onClick={() => setSwapState(null)}>
          <section
            className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Swap {TYPE_LABEL[swapState.mealType]}</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Current: {swapState.currentMealName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSwapState(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)]"
                aria-label="Close swap options"
              >
                <X size={16} />
              </button>
            </div>

            {swapOptions.length === 0 ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4 text-sm text-[var(--color-text-muted)]">
                No alternatives available for this meal type.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {swapOptions.map(option => (
                  <MealOptionCard
                    key={option.sourceAssignmentId}
                    option={option}
                    selected={isSelected(option.mealType, option.meal.id)}
                    onSelect={() => handleSelectReplacement(option)}
                    onPreview={() => {
                      // In swap modal, card click should replace directly.
                      handleSelectReplacement(option);
                    }}
                    disabled={option.mealType === 'SNACK' && !isSelected('SNACK', option.meal.id) && isSnackFull}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

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
