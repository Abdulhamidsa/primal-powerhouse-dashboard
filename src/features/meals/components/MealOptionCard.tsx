import Image from 'next/image';
import {
  CheckCircleIcon as CheckCircle2,
  ClockIcon as Clock3,
  PlusCircleIcon as PlusCircle,
} from '@phosphor-icons/react/ssr';
import type { MealOption } from '@/features/meals/types/mealSelection.types';
import { getMealImageDelivery } from '@/features/meals/utils/mealImageDelivery';

const fallbackImage = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=60';

export function MealOptionCard({
  option,
  selected,
  onSelect,
  disabled,
  onPreview,
  imagePriority = false,
}: {
  option: MealOption;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  onPreview?: () => void;
  imagePriority?: boolean;
}) {
  const totalTime = (option.meal.prepTime ?? 0) + (option.meal.cookTime ?? 0);
  const metaItems = [
    totalTime > 0 ? `${totalTime} min` : null,
    option.meal.category?.trim() ? option.meal.category : null,
    option.meal.difficulty?.trim() ? option.meal.difficulty : null,
  ].filter((item): item is string => Boolean(item));
  const image = getMealImageDelivery(option.meal.imageUrl?.trim() ? option.meal.imageUrl : fallbackImage, 'card');

  return (
    <article
      role={onPreview ? 'button' : undefined}
      tabIndex={onPreview ? 0 : undefined}
      onClick={onPreview}
      onKeyDown={
        onPreview
          ? event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPreview();
              }
            }
          : undefined
      }
      className={[
        'overflow-hidden rounded-3xl border bg-[var(--color-surface)] transition-colors',
        selected
          ? 'border-[var(--color-accent)] shadow-sm'
          : 'border-[var(--color-border)] hover:border-[var(--color-accent-muted)]',
      ].join(' ')}
    >
      <div className="relative h-36 w-full text-left">
        <Image
          src={image.src}
          alt={option.meal.name}
          fill
          className="object-cover"
          priority={imagePriority}
          unoptimized={image.unoptimized}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
      </div>

      <div className="space-y-3 p-4">
        <div className="block w-full text-left">
          <p className="line-clamp-1 text-sm font-semibold text-[var(--color-text)]">{option.meal.name}</p>
          {option.meal.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-muted)]">
              {option.meal.description}
            </p>
          ) : null}
          {totalTime > 0 ? <p className="text-xs text-[var(--color-text-muted)]">{totalTime} min total</p> : null}
        </div>

        {metaItems.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {metaItems.map(item => (
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

        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onSelect();
          }}
          disabled={disabled}
          className={[
            'inline-flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition-colors',
            selected
              ? 'bg-[var(--color-accent-translucent)] text-[var(--color-text)]'
              : 'border border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-text)] hover:border-[var(--color-accent-muted)]',
            disabled ? 'cursor-not-allowed opacity-60' : '',
          ].join(' ')}
        >
          {selected ? (
            <CheckCircle2 aria-hidden="true" focusable="false" size={16} />
          ) : (
            <PlusCircle aria-hidden="true" focusable="false" size={16} />
          )}
          {selected ? 'Selected' : 'Select'}
        </button>
      </div>
    </article>
  );
}
