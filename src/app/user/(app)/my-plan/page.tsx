'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Plus, Save, Undo2, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SkeletonMealGrid } from '@/components/Skeletons';
import { Button } from '@/components/ui/button';
import { useMealAdherenceToday } from '@/features/adherence/hooks/useMealAdherence';
import { MealPlanRandomizeButton } from '@/features/meal-plan-randomizer/components/MealPlanRandomizeButton';
import { useMealPlanRandomizer } from '@/features/meal-plan-randomizer/hooks/useMealPlanRandomizer';
import { MealOptionCard } from '@/features/meals/components/MealOptionCard';
import { PlanSelectedMealCard } from '@/features/meals/components/PlanSelectedMealCard';
import { useMealSelectionPlanner } from '@/features/meals/hooks/useMealSelectionPlanner';
import type { MealTypeKey } from '@/features/meals/types/mealSelection.types';
import { saveShoppingListDraft } from '@/features/meals/utils/shoppingListStorage';

const TYPE_LABEL: Record<MealTypeKey, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snacks',
};

const TYPE_ORDER: MealTypeKey[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

type MealPickerState = {
  mealType: MealTypeKey;
  currentMealId?: string;
  currentMealName?: string;
  mode: 'select' | 'swap';
};

export default function UserMyPlanPage() {
  const {
    loading,
    error,
    saveError,
    optionsByType,
    selectedByType,
    draftItems,
    hasRequiredSlots,
    isSelected,
    isSnackFull,
    snackMax,
    hasChanges,
    isSaving,
    selectOption,
    saveDraft,
    resetDraftToSaved,
  } = useMealSelectionPlanner();

  const {
    summary: adherenceSummary,
    error: adherenceError,
    isCompleted,
    isPending,
    toggleCompletion,
  } = useMealAdherenceToday();

  const [swapState, setSwapState] = useState<MealPickerState | null>(null);
  const mountStartedAtRef = useRef<number | null>(null);
  const loggedPaintRef = useRef(false);

  useEffect(() => {
    mountStartedAtRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (!swapState) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSwapState(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [swapState]);

  useEffect(() => {
    if (loading || error || loggedPaintRef.current) return;

    loggedPaintRef.current = true;
    const mountStartedAt = mountStartedAtRef.current ?? performance.now();

    const raf = window.requestAnimationFrame(() => {
      const paintAt = performance.now();
      console.info('[USER_MEAL_PLAN_PAINT]', { renderMs: Math.round(paintAt - mountStartedAt) });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [error, loading]);

  const isPlanComplete = hasRequiredSlots;

  const totalSelectedMeals = useMemo(() => {
    return TYPE_ORDER.reduce((acc, type) => acc + selectedByType[type].length, 0);
  }, [selectedByType]);

  const mealPlanRandomizer = useMealPlanRandomizer({
    optionsByType,
    snackMax,
    selectedCount: totalSelectedMeals,
    saveDraft,
  });

  const selectedSides = useMemo(() => {
    return [selectedByType.LUNCH[0], selectedByType.DINNER[0]]
      .filter((item): item is NonNullable<typeof item> => Boolean(item?.side))
      .map(item => ({
        mealType: item.mealType,
        side: item.side!,
        mealName: item.meal.name,
      }));
  }, [selectedByType]);

  const orderedSections = useMemo(() => {
    return TYPE_ORDER.map(type => ({
      type,
      items: selectedByType[type],
    }));
  }, [selectedByType]);

  const completedAtByKey = useMemo(() => {
    const map = new Map<string, string>();

    for (const completion of adherenceSummary?.completions ?? []) {
      const key = `${completion.mealType}:${completion.slotIndex}:${completion.mealId}`;
      map.set(key, completion.completedAt);
    }

    return map;
  }, [adherenceSummary?.completions]);

  const swapOptions = useMemo(() => {
    if (!swapState || !optionsByType) return [];
    return optionsByType[swapState.mealType] ?? [];
  }, [optionsByType, swapState]);

  const onSwapOptionSelect = (mealType: MealTypeKey, currentMealId: string, currentMealName: string) => {
    setSwapState({
      mealType,
      currentMealId,
      currentMealName,
      mode: 'swap',
    });
  };

  const onMealSelect = (mealType: MealTypeKey) => {
    setSwapState({
      mealType,
      mode: 'select',
    });
  };

  const handleSelectReplacement = (option: (typeof swapOptions)[number]) => {
    if (!swapState) return;

    if (swapState.mode === 'swap' && swapState.mealType === 'SNACK') {
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

  const handleSaveDraft = async () => {
    const ok = await saveDraft();
    if (ok) {
      saveShoppingListDraft(
        draftItems.map(item => ({
          mealType: item.mealType,
          slotIndex: item.slotIndex,
          mealId: item.mealId,
          sourceAssignmentId: item.sourceAssignmentId ?? null,
        })),
      );
    }
  };

  const renderEmptyMealState = (mealType: MealTypeKey) => (
    <div
      className="rounded-[28px] border px-4 py-5 text-center shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
        <Plus size={18} />
      </div>

      <p className="mt-3 text-sm font-semibold tracking-tight text-[var(--color-text)]">
        No {TYPE_LABEL[mealType].toLowerCase()} added yet
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">Add a meal to start building today&apos;s plan.</p>

      <Button type="button" size="sm" onClick={() => onMealSelect(mealType)} className="mt-4 h-10 rounded-full px-4">
        Add {TYPE_LABEL[mealType]}
      </Button>
    </div>
  );

  return (
    <div className="px-4 pb-6 pt-4 md:px-6">
      <div className={`mx-auto max-w-6xl space-y-4 md:space-y-5 ${hasChanges ? 'pb-28' : 'pb-6'}`}>
        <PageHeader
          title="Meal Plan"
          description="Select today&apos;s meals, swap options, and keep the plan tidy."
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-bg-alt)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
              {totalSelectedMeals} selected
            </span>
            {adherenceSummary ? (
              <span className="rounded-full bg-[var(--color-accent-translucent)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                {adherenceSummary.completion.completedCount}/{adherenceSummary.completion.totalSelectedCount} completed
                today
              </span>
            ) : null}
            {hasChanges ? (
              <span className="rounded-full bg-amber-500/12 px-3 py-1 text-xs font-semibold text-amber-400">
                Unsaved
              </span>
            ) : null}
          </div>
        </PageHeader>

        <section
          className="rounded-[30px] border px-4 py-4 shadow-[0_16px_50px_rgba(0,0,0,0.12)]"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Quick action
              </p>
              <p className="mt-1 text-sm font-medium tracking-tight text-[var(--color-text)]">Build a random full plan</p>
            </div>

            <MealPlanRandomizeButton
              onClickAction={mealPlanRandomizer.requestRandomize}
              confirmOpen={mealPlanRandomizer.confirmOpen}
              onConfirmOpenChangeAction={mealPlanRandomizer.setConfirmOpen}
              onConfirmAction={mealPlanRandomizer.randomize}
              isRandomizing={mealPlanRandomizer.isRandomizing || isSaving}
              hasExistingSelection={mealPlanRandomizer.hasExistingSelection}
              errorMessage={mealPlanRandomizer.errorMessage}
              disabled={loading || !optionsByType}
            />
          </div>
        </section>

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

        {adherenceError ? (
          <div className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-3 text-sm text-red-300">
            <AlertCircle size={16} />
            <span>{adherenceError.message}</span>
          </div>
        ) : null}

        {!loading && !error
          ? orderedSections.map(section => (
              <section
                key={section.type}
                className="space-y-3 rounded-[30px] border px-4 py-4 shadow-[0_16px_50px_rgba(0,0,0,0.10)]"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
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
                  renderEmptyMealState(section.type)
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {section.items.map(item => (
                      <PlanSelectedMealCard
                        key={`${item.mealType}_${item.slotIndex}_${item.mealId}_${item.sourceAssignmentId ?? ''}`}
                        badgeLabel={TYPE_LABEL[section.type]}
                        name={item.meal.name}
                        imageUrl={item.meal.imageUrl ?? undefined}
                        ingredientsSource={item.meal.ingredients}
                        instructionsSource={item.meal.instructions}
                        description={item.meal.description ?? undefined}
                        imagePriority
                        metaItems={[
                          (item.meal.prepTime ?? 0) + (item.meal.cookTime ?? 0) > 0
                            ? `${(item.meal.prepTime ?? 0) + (item.meal.cookTime ?? 0)} min total`
                            : null,
                          item.meal.category ?? null,
                          item.meal.difficulty ?? null,
                        ].filter((meta): meta is string => Boolean(meta))}
                        isCompleted={isCompleted(item)}
                        completedAt={completedAtByKey.get(`${item.mealType}:${item.slotIndex}:${item.mealId}`)}
                        isPending={isPending(item)}
                        onToggleCompletionAction={() => toggleCompletion(item)}
                        onSwapAction={() => onSwapOptionSelect(section.type, item.meal.id, item.meal.name)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))
          : null}

        {!loading && !error ? (
          <section
            className="space-y-3 rounded-[30px] border px-4 py-4 shadow-[0_16px_50px_rgba(0,0,0,0.10)]"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Sides</h2>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                  {selectedSides.length}
                </span>
              </div>
            </div>

            {selectedSides.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-muted)]">
                No sides selected yet. Choose a linked lunch or dinner meal to unlock a side.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {selectedSides.map(item => (
                    <PlanSelectedMealCard
                      key={`${item.mealType}_${item.side.id}`}
                      badgeLabel={item.side.type === 'SOUP' ? 'Soup' : 'Salad'}
                      name={item.side.name}
                      imageUrl={item.side.imageUrl ?? undefined}
                      ingredientsSource={item.side.ingredients}
                      instructionsSource={item.side.instructions}
                      helperText={`Linked to ${item.mealType.toLowerCase()}: ${item.mealName}`}
                      imagePriority
                      metaItems={[
                        item.side.foodOrigin ?? null,
                        item.side.fiber !== undefined && item.side.fiber !== null ? `Fiber ${item.side.fiber}g` : null,
                    ].filter((meta): meta is string => Boolean(meta))}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>

      {swapState ? (
        <div
          className="fixed inset-0 z-[70] bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="meal-picker-title"
          onClick={() => setSwapState(null)}
        >
          <div className="flex min-h-full items-center justify-center">
            <section
              className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5"
              onClick={event => event.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 id="meal-picker-title" className="text-lg font-semibold text-[var(--color-text)]">
                    {swapState.mode === 'swap'
                      ? `Swap ${TYPE_LABEL[swapState.mealType]}`
                      : `Add ${TYPE_LABEL[swapState.mealType]}`}
                  </h2>
                  {swapState.mode === 'swap' ? (
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Current selection: {swapState.currentMealName}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">Pick a meal to add to this slot.</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSwapState(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  aria-label="Close meal options"
                >
                  <X size={16} />
                </button>
              </div>

              {swapOptions.length === 0 ? (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4 text-sm text-[var(--color-text-muted)]">
                  No {swapState.mode === 'swap' ? 'alternatives' : 'options'} available for this meal type.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Swipe sideways to browse all {TYPE_LABEL[swapState.mealType].toLowerCase()} options (
                    {swapOptions.length}).
                  </p>

                  <div className="-mx-1 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex snap-x snap-mandatory gap-3 px-1">
                      {swapOptions.map(option => (
                        <div
                          key={`${option.meal.id}:${option.sourceAssignmentId ?? 'default'}`}
                          className="w-[85vw] max-w-[330px] shrink-0 snap-start"
                        >
                          <MealOptionCard
                            option={option}
                            selected={isSelected(option.mealType, option.meal.id, option.sourceAssignmentId)}
                            onSelect={() => handleSelectReplacement(option)}
                            disabled={
                              option.mealType === 'SNACK' &&
                              !isSelected('SNACK', option.meal.id, option.sourceAssignmentId) &&
                              isSnackFull
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}

      {hasChanges ? (
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
                onClick={handleSaveDraft}
                disabled={!hasChanges || isSaving}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={14} />
                {isSaving ? 'Saving...' : 'Save Selection'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
