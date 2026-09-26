'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  CheckIcon as Check,
  CheckCircleIcon as CheckCircle2,
  ClockIcon as Clock3,
  FlameIcon as Flame,
  ArrowCounterClockwiseIcon as RefreshCcw,
  GrainsIcon as Wheat,
  XIcon as X,
} from '@phosphor-icons/react';
import { normalizeMealTextList } from '@/features/meals/utils/mealText';
import { getMealImageDelivery } from '@/features/meals/utils/mealImageDelivery';

const fallbackImage = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=60';

type PlanSelectedMealCardTabKey = 'ingredients' | 'instructions';

export function PlanSelectedMealCard({
  badgeLabel,
  name,
  imageUrl,
  ingredientsSource,
  instructionsSource,
  helperText,
  description,
  metaItems,
  isCompleted = false,
  completedAt,
  onToggleCompletionAction,
  onSwapAction,
  isPending = false,
  imagePriority = false,
}: {
  badgeLabel: string;
  name: string;
  imageUrl?: string;
  ingredientsSource?: unknown;
  instructionsSource?: unknown;
  helperText?: string;
  description?: string;
  metaItems?: string[];
  isCompleted?: boolean;
  completedAt?: string;
  onToggleCompletionAction?: () => void;
  onSwapAction?: () => void;
  isPending?: boolean;
  imagePriority?: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const ingredients = useMemo(() => normalizeMealTextList(ingredientsSource), [ingredientsSource]);
  const instructions = useMemo(() => normalizeMealTextList(instructionsSource), [instructionsSource]);
  const visibleMetaItems = useMemo(() => (metaItems ?? []).filter(Boolean), [metaItems]);
  const cardImage = getMealImageDelivery(imageUrl?.trim() ? imageUrl : fallbackImage, 'card');

  const completionTimeLabel = useMemo(() => {
    if (!completedAt) return null;
    const parsed = new Date(completedAt);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [completedAt]);

  useEffect(() => {
    if (!showDetails) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDetails(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDetails]);

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        aria-label={`View details for ${name}`}
        onClick={() => setShowDetails(true)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setShowDetails(true);
          }
        }}
        className="group overflow-hidden rounded-[24px] border bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-colors hover:border-[var(--color-accent-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
        style={{
          borderColor: isCompleted ? 'var(--color-accent)' : 'var(--color-border)',
        }}
      >
        <div className="relative h-32 w-full">
          <Image
            src={cardImage.src}
            alt={name}
            fill
            className="object-cover"
            priority={imagePriority}
            unoptimized={cardImage.unoptimized}
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
              {description ? (
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{description}</p>
              ) : null}
              {helperText ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helperText}</p> : null}
              {visibleMetaItems.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {visibleMetaItems.map(item => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-muted)]"
                    >
                      <Clock3 aria-hidden="true" focusable="false" size={11} />
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {isCompleted ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-accent-translucent)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-accent)]">
                <CheckCircle2 aria-hidden="true" focusable="false" size={12} />
                {completionTimeLabel ? `Done ${completionTimeLabel}` : 'Done'}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {onToggleCompletionAction !== undefined ? (
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  onToggleCompletionAction();
                }}
                disabled={isPending}
                aria-label={isCompleted ? 'Mark as not done' : 'Mark as done'}
                className="inline-flex min-h-10 min-w-0 w-full items-center justify-center gap-1.5 rounded-full border px-2.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  borderColor: isCompleted ? 'var(--color-accent)' : 'var(--color-border)',
                  color: isCompleted ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  background: isCompleted ? 'var(--color-accent-muted)' : 'transparent',
                }}
              >
                <Check aria-hidden="true" focusable="false" size={14} />
                <span className="truncate">{isCompleted ? 'Done' : 'Mark done'}</span>
              </button>
            ) : null}

            {onSwapAction !== undefined ? (
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  onSwapAction();
                }}
                aria-label="Change meal"
                className="inline-flex min-h-10 min-w-0 w-full items-center justify-center gap-1.5 rounded-full border border-[var(--color-border)] px-2.5 py-2 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                <RefreshCcw aria-hidden="true" focusable="false" size={14} />
                <span className="truncate">Change meal</span>
              </button>
            ) : null}
          </div>
        </div>
      </article>

      {showDetails ? (
        <MealDetailModal
          name={name}
          imageUrl={imageUrl}
          ingredients={ingredients}
          instructions={instructions}
          helperText={helperText}
          description={description}
          metaItems={visibleMetaItems}
          onClose={() => setShowDetails(false)}
        />
      ) : null}
    </>
  );
}

function MealDetailModal({
  name,
  imageUrl,
  ingredients,
  instructions,
  helperText,
  description,
  metaItems,
  onClose,
}: {
  name: string;
  imageUrl?: string;
  ingredients: string[];
  instructions: string[];
  helperText?: string;
  description?: string;
  metaItems?: string[];
  onClose: () => void;
}) {
  const availableTabs = useMemo(() => {
    const tabs: Array<{ key: PlanSelectedMealCardTabKey; label: string; icon: React.ReactNode }> = [
      { key: 'ingredients', label: 'Ingredients', icon: <Wheat aria-hidden="true" focusable="false" size={13} /> },
      { key: 'instructions', label: 'Instructions', icon: <Flame aria-hidden="true" focusable="false" size={13} /> },
    ];
    return tabs;
  }, []);

  const [activeTab, setActiveTab] = useState<PlanSelectedMealCardTabKey>('ingredients');
  const detailImage = getMealImageDelivery(imageUrl?.trim() ? imageUrl : fallbackImage, 'detail');

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
            src={detailImage.src}
            alt={name}
            fill
            className="object-cover"
            unoptimized={detailImage.unoptimized}
            sizes="(max-width: 768px) 100vw, 384px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {/* Name overlay at bottom of image */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="line-clamp-2 text-base font-semibold text-white drop-shadow-sm">{name}</p>
            {description ? <p className="mt-1 line-clamp-2 text-xs text-white/80">{description}</p> : null}
            {helperText ? <p className="mt-1 line-clamp-1 text-xs text-white/75">{helperText}</p> : null}
            {metaItems?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {metaItems.map(item => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur-sm"
                  >
                    <Clock3 aria-hidden="true" focusable="false" size={11} />
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 active:scale-95"
          >
            <X aria-hidden="true" focusable="false" size={16} />
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
