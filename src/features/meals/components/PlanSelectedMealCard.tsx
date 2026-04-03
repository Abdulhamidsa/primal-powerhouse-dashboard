'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, Circle, Flame, Info, RefreshCcw, Wheat, X } from 'lucide-react';
import { normalizeMealTextList } from '@/features/meals/utils/mealText';

const fallbackImage = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=60';

type PlanSelectedMealCardTabKey = 'ingredients' | 'instructions';

export function PlanSelectedMealCard({
  badgeLabel,
  name,
  calories,
  protein,
  carbs,
  fat,
  imageUrl,
  ingredientsSource,
  instructionsSource,
  helperText,
  isCompleted = false,
  completedAt,
  onToggleCompletion,
  onSwap,
  isPending = false,
}: {
  badgeLabel: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
  ingredientsSource?: unknown;
  instructionsSource?: unknown;
  helperText?: string;
  isCompleted?: boolean;
  completedAt?: string;
  onToggleCompletion?: () => void;
  onSwap?: () => void;
  isPending?: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const ingredients = useMemo(() => normalizeMealTextList(ingredientsSource), [ingredientsSource]);
  const instructions = useMemo(() => normalizeMealTextList(instructionsSource), [instructionsSource]);

  const completionTimeLabel = useMemo(() => {
    if (!completedAt) return null;
    const parsed = new Date(completedAt);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [completedAt]);

  return (
    <>
      <article
        className="overflow-hidden rounded-[24px] border bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.16)]"
        style={{
          borderColor: isCompleted ? 'var(--color-accent)' : 'var(--color-border)',
        }}
      >
        <div className="relative h-32 w-full">
          <Image
            src={imageUrl?.trim() ? imageUrl : fallbackImage}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-[var(--color-bg-alt)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-muted)]">
                {badgeLabel}
              </span>
              <p className="mt-2 line-clamp-1 text-base font-semibold text-[var(--color-text)]">{name}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                {calories} kcal • Protein {protein}g • Carbs {carbs}g • Fat {fat}g
              </p>
              {helperText ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helperText}</p> : null}
            </div>

            {isCompleted ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-accent-translucent)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-accent)]">
                <CheckCircle2 size={12} />
                {completionTimeLabel ? `Done ${completionTimeLabel}` : 'Done'}
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            {onToggleCompletion !== undefined ? (
              <button
                type="button"
                onClick={onToggleCompletion}
                disabled={isPending}
                aria-label={isCompleted ? 'Mark as not done' : 'Mark as done'}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ color: isCompleted ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
              >
                {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </button>
            ) : null}

            {onSwap !== undefined ? (
              <button
                type="button"
                onClick={onSwap}
                aria-label="Swap meal"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                <RefreshCcw size={15} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setShowDetails(true)}
              aria-label="View meal details"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <Info size={15} />
            </button>
          </div>
        </div>
      </article>

      {showDetails ? (
        <MealDetailModal
          name={name}
          calories={calories}
          protein={protein}
          carbs={carbs}
          fat={fat}
          imageUrl={imageUrl}
          ingredients={ingredients}
          instructions={instructions}
          onClose={() => setShowDetails(false)}
        />
      ) : null}
    </>
  );
}

function MealDetailModal({
  name,
  calories,
  protein,
  carbs,
  fat,
  imageUrl,
  ingredients,
  instructions,
  onClose,
}: {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
  ingredients: string[];
  instructions: string[];
  onClose: () => void;
}) {
  const availableTabs = useMemo(() => {
    const tabs: Array<{ key: PlanSelectedMealCardTabKey; label: string; icon: React.ReactNode }> = [
      { key: 'ingredients', label: 'Ingredients', icon: <Wheat size={13} /> },
      { key: 'instructions', label: 'Instructions', icon: <Flame size={13} /> },
    ];
    return tabs;
  }, []);

  const [activeTab, setActiveTab] = useState<PlanSelectedMealCardTabKey>('ingredients');

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        style={{ maxHeight: '85dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Hero image — full width */}
        <div className="relative h-48 w-full shrink-0">
          <Image
            src={imageUrl?.trim() ? imageUrl : fallbackImage}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 384px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {/* Name overlay at bottom of image */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="line-clamp-2 text-base font-semibold text-white drop-shadow-sm">{name}</p>
            <p className="mt-0.5 text-xs text-white/80">
              {calories} kcal • P {protein}g • C {carbs}g • F {fat}g
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="shrink-0 px-4 pt-3 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {availableTabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium"
                  style={{
                    borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    background: isActive ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="mx-4 mb-4 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] [-webkit-overflow-scrolling:touch]">
          {activeTab === 'ingredients' ? (
            <ListContent items={ingredients} emptyState="No ingredients provided." />
          ) : (
            <ListContent items={instructions} emptyState="No instructions provided." numbered />
          )}
        </div>
      </div>
    </div>
  );
}

function ListContent({
  items,
  emptyState,
  numbered = false,
}: {
  items: string[];
  emptyState: string;
  numbered?: boolean;
}) {
  if (!items.length) {
    return <p className="px-3 py-3 text-xs text-[var(--color-text-muted)]">{emptyState}</p>;
  }

  return (
    <ul className="space-y-2 px-3 py-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-2 text-xs leading-5 text-[var(--color-text)]">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)]">
            {numbered ? index + 1 : '\u2022'}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
