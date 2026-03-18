import Image from 'next/image';
import { CheckCircle2, PlusCircle } from 'lucide-react';
import type { MealOption } from '@/features/meals/types/mealSelection.types';

const fallbackImage =
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=60';

export function MealOptionCard({
  option,
  selected,
  onSelect,
  disabled,
  onPreview,
}: {
  option: MealOption;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  onPreview?: () => void;
}) {
  const totalTime = (option.meal.prepTime ?? 0) + (option.meal.cookTime ?? 0);

  return (
    <article
      className={[
        'overflow-hidden rounded-3xl border bg-[var(--color-surface)] transition-colors',
        selected
          ? 'border-[var(--color-accent)] shadow-sm'
          : 'border-[var(--color-border)] hover:border-[var(--color-accent-muted)]',
      ].join(' ')}
    >
      <button type="button" onClick={onPreview} disabled={!onPreview} className="relative h-36 w-full text-left disabled:cursor-default">
        <Image
          src={option.meal.imageUrl?.trim() ? option.meal.imageUrl : fallbackImage}
          alt={option.meal.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
      </button>

      <div className="space-y-3 p-4">
        <button type="button" onClick={onPreview} disabled={!onPreview} className="block w-full text-left disabled:cursor-default">
          <p className="line-clamp-1 text-sm font-semibold text-[var(--color-text)]">{option.meal.name}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {option.meal.calories} kcal • P {option.meal.protein}g • C {option.meal.carbs}g • F {option.meal.fat}g
          </p>
          {totalTime > 0 ? <p className="text-xs text-[var(--color-text-muted)]">{totalTime} min total</p> : null}
        </button>

        <button
          type="button"
          onClick={onSelect}
          disabled={disabled}
          className={[
            'inline-flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition-colors',
            selected
              ? 'bg-[var(--color-accent-translucent)] text-[var(--color-text)]'
              : 'border border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-text)] hover:border-[var(--color-accent-muted)]',
            disabled ? 'cursor-not-allowed opacity-60' : '',
          ].join(' ')}
        >
          {selected ? <CheckCircle2 size={16} /> : <PlusCircle size={16} />}
          {selected ? 'Selected' : 'Select'}
        </button>
      </div>
    </article>
  );
}
