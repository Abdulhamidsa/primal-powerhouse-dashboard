'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  WarningCircleIcon as AlertCircle,
  WarningCircleIcon as CircleAlert,
  PlusIcon as Plus,
  BowlFoodIcon as Salad,
  XIcon as X,
} from '@phosphor-icons/react';
import { PullToRefresh } from '@/components/PullToRefresh';
import { UserPageHero } from '@/components/UserPageHero';
import { SkeletonMealGrid } from '@/components/Skeletons';
import { Button } from '@/components/ui/button';
import { useMealAdherenceToday } from '@/features/adherence/hooks/useMealAdherence';
import { MealOptionCard } from '@/features/meals/components/MealOptionCard';
import { PlanSelectedMealCard } from '@/features/meals/components/PlanSelectedMealCard';
import { useMealSelectionPlanner } from '@/features/meals/hooks/useMealSelectionPlanner';
import type { MealOption, MealTypeKey } from '@/features/meals/types/mealSelection.types';
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

function MealPlanHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meal-plan-help-title"
      onClick={onClose}
    >
      <section
        className="w-full max-w-md rounded-[28px] border m-auto border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              How it works
            </p>
            <h2
              id="meal-plan-help-title"
              className="mt-1.5 text-xl font-semibold tracking-tight text-[var(--color-text)]"
            >
              Your meal feedback
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close meal plan explanation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            <X aria-hidden="true" focusable="false" size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <HelpStep
            number="1"
            title="Choose your meals"
            description="Your coach assigns several options for breakfast, lunch, dinner, and sometimes snacks. Pick the meals you want for today."
          />
          <HelpStep
            number="2"
            title="Eat your selected meal"
            description="You can open any meal to view its ingredients and instructions."
          />
          <HelpStep
            number="3"
            title="Tap Done after eating"
            description="Done means “I ate this meal”. This gives your coach useful feedback about which meals you actually followed."
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white"
        >
          Got it
        </button>
      </section>
    </div>
  );
}

function HelpStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-translucent)] text-xs font-semibold text-[var(--color-accent)]">
        {number}
      </span>
      <div>
        <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{description}</p>
      </div>
    </div>
  );
}

function MealSwapConfirmModal({
  mealType,
  currentMealName,
  nextMealName,
  isSaving,
  onCancel,
  onConfirm,
}: {
  mealType: MealTypeKey;
  currentMealName?: string;
  nextMealName: string;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meal-swap-confirm-title"
    >
      <section className="w-full max-w-sm rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          {TYPE_LABEL[mealType]}
        </p>
        <h2 id="meal-swap-confirm-title" className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text)]">
          {currentMealName ? 'Swap this meal?' : 'Choose this meal?'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          {currentMealName ? (
            <>
              Replace <span className="font-semibold text-[var(--color-text)]">{currentMealName}</span> with{' '}
              <span className="font-semibold text-[var(--color-text)]">{nextMealName}</span>?
            </>
          ) : (
            <>
              Choose <span className="font-semibold text-[var(--color-text)]">{nextMealName}</span> for today?
            </>
          )}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="min-h-11 rounded-full border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="min-h-11 rounded-full bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Yes, save'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function UserMyPlanPage() {
  const {
    loading,
    error,
    optionsByType,
    selectedByType,
    isSelected,
    isSnackFull,
    snackMax,
    isSaving,
    refresh,
    selectOptionAndSave,
  } = useMealSelectionPlanner();

  const {
    summary: adherenceSummary,
    error: adherenceError,
    isCompleted,
    isPending,
    toggleCompletion,
  } = useMealAdherenceToday();

  const [swapState, setSwapState] = useState<MealPickerState | null>(null);
  const [pendingSwap, setPendingSwap] = useState<MealOption | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState<'saved' | 'error' | null>(null);
  const mountStartedAtRef = useRef<number | null>(null);
  const loggedPaintRef = useRef(false);
  const saveNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountStartedAtRef.current = performance.now();

    return () => {
      if (saveNoticeTimerRef.current) clearTimeout(saveNoticeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!swapState) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPendingSwap(null);
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
  const selectedMealCount = useMemo(
    () => orderedSections.reduce((sum, section) => sum + section.items.length, 0),
    [orderedSections],
  );
  const priorityMealKeys = useMemo(() => {
    return new Set(
      orderedSections
        .flatMap(section => section.items)
        .slice(0, 2)
        .map(item => `${item.mealType}_${item.slotIndex}_${item.mealId}_${item.sourceAssignmentId ?? ''}`),
    );
  }, [orderedSections]);

  const completedAtByKey = useMemo(() => {
    const map = new Map<string, string>();

    for (const completion of adherenceSummary?.completions ?? []) {
      const key = `${completion.mealType}:${completion.slotIndex}:${completion.mealId}`;
      map.set(key, completion.completedAt);
    }

    return map;
  }, [adherenceSummary?.completions]);
  const completedMealCount = completedAtByKey.size;

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
    setPendingSwap(option);
  };

  const handleConfirmSwap = async () => {
    if (!swapState || !pendingSwap) return;

    const currentSnack =
      swapState.mode === 'swap' && swapState.mealType === 'SNACK'
        ? selectedByType.SNACK.find(item => item.meal.id === swapState.currentMealId)
        : undefined;
    const selectedOption = pendingSwap;
    setPendingSwap(null);
    setSwapState(null);
    setSaveNotice('saved');

    if (saveNoticeTimerRef.current) clearTimeout(saveNoticeTimerRef.current);
    saveNoticeTimerRef.current = setTimeout(() => setSaveNotice(null), 1800);

    const result = await selectOptionAndSave(selectedOption, currentSnack);

    if (result.ok) {
      saveShoppingListDraft(
        result.items.map(item => ({
          mealType: item.mealType,
          slotIndex: item.slotIndex,
          mealId: item.mealId,
          sourceAssignmentId: item.sourceAssignmentId ?? null,
        })),
      );
      return;
    }

    setSaveNotice('error');
    if (saveNoticeTimerRef.current) clearTimeout(saveNoticeTimerRef.current);
    saveNoticeTimerRef.current = setTimeout(() => setSaveNotice(null), 3200);
  };

  const renderEmptyMealState = (mealType: MealTypeKey) => (
    <div
      className="rounded-[28px] border px-4 py-5 text-center shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
        <Plus aria-hidden="true" focusable="false" size={18} />
      </div>

      <p className="mt-3 text-sm font-semibold tracking-tight text-[var(--color-text)]">
        No {TYPE_LABEL[mealType].toLowerCase()} added yet
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
        Choose a meal from the options assigned by your coach.
      </p>

      <Button type="button" size="sm" onClick={() => onMealSelect(mealType)} className="mt-4 h-10 rounded-full px-4">
        Choose {TYPE_LABEL[mealType]}
      </Button>
    </div>
  );

  return (
    <PullToRefresh onRefreshAction={refresh} disabled={Boolean(swapState || pendingSwap || helpOpen)}>
      <div className="px-4 pb-6 pt-4 md:px-6">
        <div className="mx-auto max-w-6xl space-y-4 pb-6 md:space-y-5">
          <UserPageHero
            eyebrow="Plan"
            title="Meal Plan"
            description="Choose your meals for today and mark them done after eating."
            icon={<Salad aria-hidden="true" focusable="false" size={17} />}
            statusItems={[
              { label: 'Selected', value: `${selectedMealCount}`, tone: selectedMealCount ? 'good' : 'warn' },
              { label: 'Completed', value: `${completedMealCount}`, tone: completedMealCount ? 'good' : 'neutral' },
            ]}
          >
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              aria-label="How the meal plan works"
            >
              <CircleAlert aria-hidden="true" focusable="false" size={15} />
              How it works
            </button>
          </UserPageHero>

          {loading ? <SkeletonMealGrid /> : null}

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              Failed to load your selected meals: {error.message}
            </div>
          ) : null}

          {adherenceError ? (
            <div className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-3 text-sm text-red-300">
              <AlertCircle aria-hidden="true" focusable="false" size={16} />
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
                    </div>

                    <span className="text-xs font-medium text-[var(--color-text-muted)]">
                      {section.type === 'SNACK' ? `Optional · up to ${snackMax}` : 'Choose 1'}
                    </span>
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
                          imagePriority={priorityMealKeys.has(
                            `${item.mealType}_${item.slotIndex}_${item.mealId}_${item.sourceAssignmentId ?? ''}`,
                          )}
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

          {!loading && !error && selectedSides.length > 0 ? (
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
                    metaItems={[
                      item.side.foodOrigin ?? null,
                      item.side.fiber !== undefined && item.side.fiber !== null ? `Fiber ${item.side.fiber}g` : null,
                    ].filter((meta): meta is string => Boolean(meta))}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <MealPlanHelp open={helpOpen} onClose={() => setHelpOpen(false)} />

        {saveNotice ? (
          <div
            role="status"
            className="fixed inset-x-4 bottom-24 z-[150] mx-auto max-w-sm rounded-2xl border px-4 py-3 text-sm font-medium shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl lg:bottom-6"
            style={{
              background: 'var(--color-surface)',
              borderColor: saveNotice === 'saved' ? 'var(--color-accent)' : 'var(--color-danger)',
              color: saveNotice === 'saved' ? 'var(--color-text)' : 'var(--color-danger)',
            }}
          >
            {saveNotice === 'saved'
              ? 'Meal saved'
              : 'Something went wrong saving the meal. Your previous meal was restored.'}
          </div>
        ) : null}

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
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Choose a meal for today from your coach&apos;s options.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingSwap(null);
                      setSwapState(null);
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                    aria-label="Close meal options"
                  >
                    <X aria-hidden="true" focusable="false" size={16} />
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

        {swapState && pendingSwap ? (
          <MealSwapConfirmModal
            mealType={swapState.mealType}
            currentMealName={swapState.mode === 'swap' ? swapState.currentMealName : undefined}
            nextMealName={pendingSwap.meal.name}
            isSaving={isSaving}
            onCancel={() => setPendingSwap(null)}
            onConfirm={() => void handleConfirmSwap()}
          />
        ) : null}
      </div>
    </PullToRefresh>
  );
}
