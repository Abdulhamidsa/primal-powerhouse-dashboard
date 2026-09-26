'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon as ArrowLeft, ClockIcon as Clock3, LeafIcon as Leaf, XIcon as X } from '@phosphor-icons/react';
import { SkeletonMealGrid } from '@/components/Skeletons';
import { MealOptionCard } from '@/features/meals/components/MealOptionCard';
import { useMealSelectionPlanner } from '@/features/meals/hooks/useMealSelectionPlanner';
import type { MealOption, MealTypeKey, SideProgramOption } from '@/features/meals/types/mealSelection.types';
import { getMealImageDelivery } from '@/features/meals/utils/mealImageDelivery';

const fallbackImage = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=60';

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
  const [previewMeal, setPreviewMeal] = useState<MealOption['meal'] | null>(null);
  const [previewSide, setPreviewSide] = useState<SideProgramOption['side'] | null>(null);

  const mealTypeParam = typeof params?.mealType === 'string' ? params.mealType : '';
  const mealType = TYPE_MAP[mealTypeParam.toLowerCase()];
  const isSidesPage = mealTypeParam.toLowerCase() === 'sides';

  const {
    loading,
    error,
    saveError,
    optionsByType,
    sideOptions,
    snackMax,
    snackCount,
    isSnackFull,
    selectedByType,
    isSelected,
    selectOption,
    saveDraft,
    hasChanges,
    isSaving,
  } = useMealSelectionPlanner();

  const options = useMemo(() => {
    if (!mealType || !optionsByType) return [];
    return optionsByType[mealType] ?? [];
  }, [mealType, optionsByType]);
  const previewMealImage = previewMeal
    ? getMealImageDelivery(previewMeal.imageUrl?.trim() ? previewMeal.imageUrl : fallbackImage, 'detail')
    : null;
  const previewSideImage = previewSide
    ? getMealImageDelivery(previewSide.imageUrl?.trim() ? previewSide.imageUrl : fallbackImage, 'detail')
    : null;

  if (!mealType && !isSidesPage) {
    return (
      <div className="px-4 py-6 md:px-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <button
            type="button"
            onClick={() => router.push('/user/program')}
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]"
          >
            <ArrowLeft aria-hidden="true" focusable="false" size={16} />
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
          <ArrowLeft aria-hidden="true" focusable="false" size={16} />
          Back to Program
        </button>

        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            {isSidesPage ? 'Sides' : TYPE_TITLE[mealType]}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {isSidesPage
              ? 'Select a side to switch to the linked lunch or dinner option.'
              : mealType === 'SNACK'
                ? `Select up to ${snackMax} snacks.`
                : `Select one ${TYPE_TITLE[mealType].toLowerCase()} option.`}
          </p>
          {mealType === 'SNACK' && !isSidesPage ? (
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

        {!loading && !error && ((isSidesPage && sideOptions.length === 0) || (!isSidesPage && options.length === 0)) ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            {isSidesPage ? 'No side options available yet.' : 'No options available for this meal type yet.'}
          </div>
        ) : null}

        {isSidesPage && sideOptions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sideOptions.map(option => {
              const currentItem = selectedByType[option.sourceMealType][0];
              const isCurrentSelection = currentItem?.sourceAssignmentId === option.sourceAssignmentId;

              return (
                <SideOptionCard
                  key={option.sourceAssignmentId}
                  option={option}
                  selected={isCurrentSelection}
                  onSelect={() =>
                    selectOption({
                      sourceAssignmentId: option.sourceAssignmentId,
                      mealType: option.sourceMealType,
                      portion: option.portion,
                      scheduledTime: option.scheduledTime,
                      side: option.side,
                      meal: option.meal,
                    })
                  }
                  onPreview={() => setPreviewSide(option.side)}
                />
              );
            })}
          </div>
        ) : null}

        {!isSidesPage && options.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {options.map(option => (
              <MealOptionCard
                key={option.sourceAssignmentId}
                option={option}
                selected={isSelected(option.mealType, option.meal.id, option.sourceAssignmentId)}
                onSelect={() => selectOption(option)}
                onPreview={() => setPreviewMeal(option.meal)}
                disabled={
                  mealType === 'SNACK' && !isSelected('SNACK', option.meal.id, option.sourceAssignmentId) && isSnackFull
                }
              />
            ))}
          </div>
        ) : null}
      </div>

      {previewMeal ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
          onClick={() => setPreviewMeal(null)}
        >
          <section
            className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]"
            onClick={event => event.stopPropagation()}
          >
            <div className="relative h-52 w-full">
              <Image
                src={previewMealImage?.src ?? fallbackImage}
                alt={previewMeal.name}
                fill
                className="object-cover"
                unoptimized={previewMealImage?.unoptimized}
                sizes="(max-width: 768px) 100vw, 560px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <button
                type="button"
                onClick={() => setPreviewMeal(null)}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur"
                aria-label="Close preview"
              >
                <X aria-hidden="true" focusable="false" size={16} />
              </button>
              <div className="absolute bottom-3 left-3 right-3">
                <h2 className="text-lg font-semibold text-white">{previewMeal.name}</h2>
                {previewMeal.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-white/85">{previewMeal.description}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                {(previewMeal.prepTime ?? 0) + (previewMeal.cookTime ?? 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-2.5 py-1">
                    <Clock3 aria-hidden="true" focusable="false" size={12} />
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
                  <p className="mt-1 whitespace-pre-line text-sm text-[var(--color-text-muted)]">
                    {previewMeal.ingredients}
                  </p>
                </div>
              ) : null}

              {previewMeal.instructions ? (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Instructions</h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-[var(--color-text-muted)]">
                    {previewMeal.instructions}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {previewSide ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
          onClick={() => setPreviewSide(null)}
        >
          <section
            className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]"
            onClick={event => event.stopPropagation()}
          >
            <div className="relative h-52 w-full">
              <Image
                src={previewSideImage?.src ?? fallbackImage}
                alt={previewSide.name}
                fill
                className="object-cover"
                unoptimized={previewSideImage?.unoptimized}
                sizes="(max-width: 768px) 100vw, 560px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <button
                type="button"
                onClick={() => setPreviewSide(null)}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur"
                aria-label="Close preview"
              >
                <X aria-hidden="true" focusable="false" size={16} />
              </button>
              <div className="absolute bottom-3 left-3 right-3">
                <h2 className="text-lg font-semibold text-white">{previewSide.name}</h2>
                <p className="mt-1 text-xs text-white/85">{previewSide.type === 'SOUP' ? 'Soup' : 'Salad'}</p>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-2.5 py-1">
                  <Leaf aria-hidden="true" focusable="false" size={12} />
                  {previewSide.type === 'SOUP' ? 'Soup' : 'Salad'}
                </span>
                {previewSide.foodOrigin ? (
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-2.5 py-1">
                    {previewSide.foodOrigin}
                  </span>
                ) : null}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Ingredients</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-[var(--color-text-muted)]">
                  {previewSide.ingredients.join(', ')}
                </p>
              </div>

              {previewSide.instructions.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Instructions</h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-[var(--color-text-muted)]">
                    {previewSide.instructions.join('\n')}
                  </p>
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
            onClick={() => saveDraft()}
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

function SideOptionCard({
  option,
  selected,
  onSelect,
  onPreview,
}: {
  option: SideProgramOption;
  selected: boolean;
  onSelect: () => void;
  onPreview?: () => void;
}) {
  const image = getMealImageDelivery(option.side.imageUrl?.trim() ? option.side.imageUrl : fallbackImage, 'card');

  return (
    <article
      className={[
        'overflow-hidden rounded-3xl border bg-[var(--color-surface)] transition-colors',
        selected
          ? 'border-[var(--color-accent)] shadow-sm'
          : 'border-[var(--color-border)] hover:border-[var(--color-accent-muted)]',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onPreview}
        disabled={!onPreview}
        className="relative h-36 w-full text-left disabled:cursor-default"
      >
        <Image
          src={image.src}
          alt={option.side.name}
          fill
          className="object-cover"
          unoptimized={image.unoptimized}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
          {option.sourceMealType === 'LUNCH' ? 'Lunch side' : 'Dinner side'}
        </div>
      </button>

      <div className="space-y-3 p-4">
        <button
          type="button"
          onClick={onPreview}
          disabled={!onPreview}
          className="block w-full text-left disabled:cursor-default"
        >
          <p className="line-clamp-1 text-sm font-semibold text-[var(--color-text)]">{option.side.name}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {option.side.type === 'SOUP' ? 'Soup' : 'Salad'}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Linked to {option.sourceMealType.toLowerCase()}: {option.meal.name}
          </p>
        </button>

        <button
          type="button"
          onClick={onSelect}
          className={[
            'inline-flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition-colors',
            selected
              ? 'bg-[var(--color-accent-translucent)] text-[var(--color-text)]'
              : 'border border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-text)] hover:border-[var(--color-accent-muted)]',
          ].join(' ')}
        >
          <Leaf aria-hidden="true" focusable="false" size={16} />
          {selected ? 'Selected' : 'Select'}
        </button>
      </div>
    </article>
  );
}
