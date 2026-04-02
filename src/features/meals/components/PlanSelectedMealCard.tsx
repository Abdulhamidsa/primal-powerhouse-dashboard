'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Circle,
  Flame,
  Info,
  RefreshCcw,
  Sparkles,
  Wheat,
  X,
} from 'lucide-react';
import { normalizeMealTextList } from '@/features/meals/utils/mealText';

type PlanSelectedMealCardTabKey = 'photo' | 'ingredients' | 'spices' | 'instructions';

const fallbackImage = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=60';

export function PlanSelectedMealCard({
  badgeLabel,
  name,
  imageUrl,
  calories,
  protein,
  carbs,
  fat,
  ingredientsSource,
  spicesSource,
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
  imageUrl?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredientsSource?: unknown;
  spicesSource?: unknown;
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
  const spices = useMemo(() => normalizeMealTextList(spicesSource), [spicesSource]);
  const instructions = useMemo(() => normalizeMealTextList(instructionsSource), [instructionsSource]);

  const imageSrc = imageUrl?.trim() ? imageUrl : fallbackImage;

  const completionTimeLabel = useMemo(() => {
    if (!completedAt) return null;
    const parsed = new Date(completedAt);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [completedAt]);

  const detailPreview = useMemo(
    () => [
      { label: 'Ingredients', value: ingredients.length },
      { label: 'Spices', value: spices.length },
      { label: 'Steps', value: instructions.length },
    ],
    [ingredients.length, spices.length, instructions.length],
  );

  return (
    <>
      <article
        className="overflow-hidden rounded-[28px] border bg-[var(--color-surface)] shadow-[0_14px_44px_rgba(0,0,0,0.16)]"
        style={{
          borderColor: isCompleted ? 'var(--color-accent)' : 'var(--color-border)',
        }}
      >
        <button type="button" onClick={() => setShowDetails(true)} className="block w-full text-left">
          <div className="relative h-52 overflow-hidden">
            <Image src={imageSrc} alt={name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

            <div className="absolute left-4 top-4 inline-flex rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {badgeLabel}
            </div>

            {isCompleted ? (
              <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)]/90 px-3 py-1 text-[11px] font-semibold text-white shadow-lg">
                <CheckCircle2 size={12} />
                {completionTimeLabel ? `Done ${completionTimeLabel}` : 'Done'}
              </div>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-lg font-semibold leading-tight">{name}</p>
                  <p className="mt-1 text-xs text-white/80">
                    {calories} kcal • Protein {protein}g • Carbs {carbs}g • Fat {fat}g
                  </p>
                </div>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm">
                  <ChevronRight size={16} />
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4">
            {helperText ? <p className="text-sm text-[var(--color-text-muted)]">{helperText}</p> : null}

            <div className="grid grid-cols-3 gap-2">
              {detailPreview.map(item => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2"
                >
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)]">
              <Info size={13} />
              Tap to open full meal details
            </div>
          </div>
        </button>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
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
      </article>

      {showDetails ? (
        <MealDetailModal
          name={name}
          imageSrc={imageSrc}
          calories={calories}
          protein={protein}
          carbs={carbs}
          fat={fat}
          ingredients={ingredients}
          spices={spices}
          instructions={instructions}
          onClose={() => setShowDetails(false)}
        />
      ) : null}
    </>
  );
}

function MealDetailModal({
  name,
  imageSrc,
  calories,
  protein,
  carbs,
  fat,
  ingredients,
  spices,
  instructions,
  onClose,
}: {
  name: string;
  imageSrc: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  spices: string[];
  instructions: string[];
  onClose: () => void;
}) {
  const availableTabs = useMemo(() => {
    const tabs: Array<{ key: PlanSelectedMealCardTabKey; label: string; icon: ReactNode }> = [
      { key: 'photo', label: 'Photo', icon: <Camera size={13} /> },
      { key: 'ingredients', label: 'Ingredients', icon: <Wheat size={13} /> },
    ];
    if (spices.length > 0) {
      tabs.push({ key: 'spices', label: 'Spices', icon: <Sparkles size={13} /> });
    }
    tabs.push({ key: 'instructions', label: 'Instructions', icon: <Flame size={13} /> });
    return tabs;
  }, [spices.length]);

  const [activeTab, setActiveTab] = useState<PlanSelectedMealCardTabKey>('photo');

  const spotlightItems = useMemo(
    () => [
      { label: 'Calories', value: `${calories}` },
      { label: 'Protein', value: `${protein}g` },
      { label: 'Carbs', value: `${carbs}g` },
      { label: 'Fat', value: `${fat}g` },
    ],
    [calories, carbs, fat, protein],
  );

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div className="h-full w-full overflow-y-auto">
        <div
          className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-bg-alt)]">
            <div className="relative h-[44vh] min-h-[320px] w-full">
              <Image src={imageSrc} alt={name} fill className="object-cover" sizes="100vw" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/5" />
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
            >
              <X size={18} />
            </button>

            <div className="absolute inset-x-0 bottom-0 px-4 pb-5 pt-16 text-white sm:px-6">
              <div className="max-w-5xl">
                <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
                  Meal Details
                </div>
                <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{name}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/78">
                  Review the photo, ingredients, spices, and cooking steps in one place before you prepare or log this meal.
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:px-8 lg:py-8">
            <aside className="lg:sticky lg:top-6 lg:w-[280px] lg:shrink-0">
              <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Nutrition Snapshot
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {spotlightItems.map(item => (
                    <div key={item.label} className="rounded-2xl bg-[var(--color-surface)] px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{item.label}</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 rounded-2xl bg-[var(--color-surface)] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                    Included
                  </p>
                  <div className="flex items-center justify-between text-sm text-[var(--color-text)]">
                    <span>Ingredients</span>
                    <span className="font-medium">{ingredients.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[var(--color-text)]">
                    <span>Spices</span>
                    <span className="font-medium">{spices.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[var(--color-text)]">
                    <span>Steps</span>
                    <span className="font-medium">{instructions.length}</span>
                  </div>
                </div>
              </div>
            </aside>

            <section className="min-w-0 flex-1">
              <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_14px_44px_rgba(0,0,0,0.08)]">
                <div className="border-b border-[var(--color-border)] px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
                  <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {availableTabs.map(tab => {
                      const isActive = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveTab(tab.key)}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-colors"
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

                <div className="min-h-[380px] p-4 sm:p-6">
                  {activeTab === 'photo' ? (
                    <div className="relative h-[52vh] min-h-[320px] overflow-hidden rounded-[26px] border border-[var(--color-border)] bg-[var(--color-bg-alt)]">
                      <Image
                        src={imageSrc}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 960px"
                      />
                    </div>
                  ) : activeTab === 'ingredients' ? (
                    <ListContent
                      items={ingredients}
                      emptyState="No ingredients provided."
                      title="Ingredients"
                      tone="soft"
                    />
                  ) : activeTab === 'spices' ? (
                    <ListContent items={spices} emptyState="No spices provided." title="Spices" tone="soft" />
                  ) : (
                    <ListContent
                      items={instructions}
                      emptyState="No instructions provided."
                      numbered
                      title="Instructions"
                      tone="strong"
                    />
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListContent({
  items,
  emptyState,
  numbered = false,
  title,
  tone = 'soft',
}: {
  items: string[];
  emptyState: string;
  numbered?: boolean;
  title?: string;
  tone?: 'soft' | 'strong';
}) {
  if (!items.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-alt)] px-4 py-8 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">{emptyState}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{title}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {numbered ? 'Step-by-step preparation guide.' : 'Everything you need for this meal.'}
          </p>
        </div>
      ) : null}

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm leading-6 text-[var(--color-text)]"
            style={{ background: tone === 'strong' ? 'var(--color-bg-alt)' : 'var(--color-surface)' }}
          >
            <span
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{
                color: numbered ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: numbered ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
              }}
            >
              {numbered ? index + 1 : '\u2022'}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
