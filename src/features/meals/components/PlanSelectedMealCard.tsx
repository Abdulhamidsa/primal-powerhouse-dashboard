'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Camera, Flame, Sparkles, Wheat } from 'lucide-react';
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
  actions,
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
  actions?: React.ReactNode;
}) {
  const ingredients = useMemo(() => normalizeMealTextList(ingredientsSource), [ingredientsSource]);
  const spices = useMemo(() => normalizeMealTextList(spicesSource), [spicesSource]);
  const instructions = useMemo(() => normalizeMealTextList(instructionsSource), [instructionsSource]);

  const availableTabs = useMemo(() => {
    const tabs: Array<{ key: PlanSelectedMealCardTabKey; label: string; icon: React.ReactNode }> = [
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
  const imageSrc = imageUrl?.trim() ? imageUrl : fallbackImage;

  return (
    <article className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.16)]">
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
        </div>

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

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)]">
          {activeTab === 'photo' ? (
            <div className="relative h-40 w-full overflow-hidden rounded-2xl">
              <Image
                src={imageSrc}
                alt={name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              />
            </div>
          ) : activeTab === 'ingredients' ? (
            <ListContent items={ingredients} emptyState="No ingredients provided." />
          ) : activeTab === 'spices' ? (
            <ListContent items={spices} emptyState="No spices provided." />
          ) : (
            <ListContent items={instructions} emptyState="No instructions provided." numbered />
          )}
        </div>

        {actions ? <div className="grid grid-cols-2 gap-2">{actions}</div> : null}
      </div>
    </article>
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
    <ul className="max-h-40 space-y-2 overflow-y-auto px-3 py-3">
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
