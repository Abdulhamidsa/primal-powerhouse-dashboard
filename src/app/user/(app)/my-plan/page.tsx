'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Save,
  Undo2,
  X,
} from 'lucide-react';
import { SkeletonMealGrid } from '@/components/Skeletons';
import { MealOptionCard } from '@/features/meals/components/MealOptionCard';
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
    selectedByType.BREAKFAST.length === 1 &&
    selectedByType.LUNCH.length === 1 &&
    selectedByType.DINNER.length === 1;

  const totalSelectedMeals = useMemo(() => {
    return TYPE_ORDER.reduce((acc, type) => acc + selectedByType[type].length, 0);
  }, [selectedByType]);

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
    <div className="min-h-screen px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-6xl space-y-5 pb-28">
        <button
          type="button"
          onClick={() => router.push('/user/program')}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={16} />
          Back to Program
        </button>

        <section className="overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,106,78,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_30%)]" />
            <div className="relative flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-7">
              <div className="max-w-2xl">
               
                <h1 className="text-2xl font-semibold text-[var(--color-text)] md:text-3xl">Meal Plan</h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-muted)] md:text-[15px]">
                  Pick your current meals and keep your plan clean: one breakfast, one lunch, one dinner, and up to two
                  snacks.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                    {totalSelectedMeals} selected
                  </div>

                  <div
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      isPlanComplete
                        ? 'bg-emerald-500/12 text-emerald-400'
                        : 'bg-[var(--color-accent-translucent)] text-[var(--color-accent)]'
                    }`}
                  >
                    {isPlanComplete ? 'Plan completed' : 'Missing required meals'}
                  </div>

                  {hasChanges ? (
                    <div className="rounded-full bg-amber-500/12 px-3 py-1.5 text-xs font-semibold text-amber-400">
                      Unsaved changes
                    </div>
                  ) : null}
                </div>
              </div>
{/* 
              <div className="grid grid-cols-2 gap-3 md:min-w-[280px]">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
                  <p className="text-xs text-[var(--color-text-muted)]">Breakfast / Lunch / Dinner</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">
                    {selectedByType.BREAKFAST.length}/{selectedByType.LUNCH.length}/{selectedByType.DINNER.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
                  <p className="text-xs text-[var(--color-text-muted)]">Snacks</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{selectedByType.SNACK.length}/2</p>
                </div>
              </div> */}
            </div>
          </div>
        </section>

        {/* <section className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text)] md:text-base">Daily totals</h2>
              <p className="text-xs text-[var(--color-text-muted)] md:text-sm">
                Compact overview of your selected plan vs coach target
              </p>
            </div>
          </div>

          <div className="[&_.rounded-3xl]:rounded-2xl [&_.p-5]:p-3 md:[&_.p-5]:p-4">
            <MealSelectionSummaryCard selected={selectedTotals} target={coachTargetTotals} delta={delta} subtle />
          </div>
        </section> */}

        {loading ? <SkeletonMealGrid /> : null}

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            Failed to load your selected meals: {error.message}
          </div>
        ) : null}

        {saveError ? (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-3 text-sm text-amber-300">
            <AlertCircle size={16} />
            <span>{saveError.message}</span>
          </div>
        ) : null}

        {!loading && !error
          ? orderedSections.map(section => (
              <section key={section.type} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">{TYPE_LABEL[section.type]}</h2>
                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                      {section.items.length}
                    </span>
                  </div>

                  {section.type === 'SNACK' ? (
                    <span className="text-xs text-[var(--color-text-muted)]">Up to 2 snacks</span>
                  ) : null}
                </div>

                {section.items.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-muted)]">
                    No {TYPE_LABEL[section.type].toLowerCase()} selected yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {section.items.map(item => (
                      <article
                        key={`${item.mealType}_${item.slotIndex}_${item.mealId}`}
                        className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        <div className="relative h-40 w-full">
                          <Image
                            src={item.meal.imageUrl?.trim() ? item.meal.imageUrl : fallbackImage}
                            alt={item.meal.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                          <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                            {TYPE_LABEL[section.type]}
                          </div>
                        </div>

                        <div className="space-y-4 p-4">
                          <div>
                            <p className="line-clamp-1 text-base font-semibold text-[var(--color-text)]">{item.meal.name}</p>
                            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                              {item.meal.calories} kcal • Protein {item.meal.protein}g • Carbs {item.meal.carbs}g • Fat{' '}
                              {item.meal.fat}g
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => onSwapOptionSelect(section.type, item.meal.id, item.meal.name)}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent-translucent)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)] transition-opacity hover:opacity-90"
                            >
                              Swap
                              <ChevronRight size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => router.push(`/user/meals/${item.meal.id}`)}
                              className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
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
        <div className="fixed inset-0 z-[70] bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSwapState(null)}>
          <div className="flex min-h-full items-center justify-center">
            <section
              className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5"
              onClick={event => event.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">Swap {TYPE_LABEL[swapState.mealType]}</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">Current selection: {swapState.currentMealName}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSwapState(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
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
                        handleSelectReplacement(option);
                      }}
                      disabled={option.mealType === 'SNACK' && !isSelected('SNACK', option.meal.id) && isSnackFull}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-24 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)]/92 p-3 backdrop-blur-xl sm:px-6 lg:bottom-0">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <div className="hidden items-center gap-2 md:flex">
            {isPlanComplete ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/12 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 size={14} />
                Plan ready
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-translucent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)]">
                <AlertCircle size={14} />
                Complete breakfast, lunch and dinner
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={resetDraftToSaved}
              disabled={!hasChanges || isSaving}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Undo2 size={14} />
              Reset
            </button>

            <button
              type="button"
              onClick={saveDraft}
              disabled={!hasChanges || isSaving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              {isSaving ? 'Saving...' : 'Save Selection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}