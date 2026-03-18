'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SkeletonMealGrid } from '@/components/Skeletons';
import { MealSelectionSummaryCard } from '@/features/meals/components/MealSelectionSummaryCard';
import { useMealSelectionPlanner } from '@/features/meals/hooks/useMealSelectionPlanner';
import type { MealTypeKey } from '@/features/meals/types/mealSelection.types';

const TYPE_LABEL: Record<MealTypeKey, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snacks',
};

const TYPE_ORDER: MealTypeKey[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

export default function UserMyPlanPage() {
  const router = useRouter();
  const { loading, error, selectedByType, selectedTotals, baselineTotals, delta } = useMealSelectionPlanner();

  const orderedSections = useMemo(() => {
    return TYPE_ORDER.map(type => ({
      type,
      items: selectedByType[type],
    }));
  }, [selectedByType]);

  return (
    <div className="px-4 py-6 md:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <button
          type="button"
          onClick={() => router.push('/user/program')}
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]"
        >
          <ArrowLeft size={16} />
          Back to Program
        </button>

        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">My Plan</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Your currently selected meals: one breakfast, lunch, dinner, and up to two snacks.
          </p>
        </section>

        <MealSelectionSummaryCard selected={selectedTotals} baseline={baselineTotals} delta={delta} />

        {loading ? <SkeletonMealGrid /> : null}

        {error ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-sm text-[var(--color-accent)]">
            Failed to load your selected meals: {error.message}
          </div>
        ) : null}

        {!loading && !error
          ? orderedSections.map(section => (
              <section key={section.type} className="space-y-3">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">{TYPE_LABEL[section.type]}</h2>

                {section.items.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-muted)]">
                    No {TYPE_LABEL[section.type].toLowerCase()} selected.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map(item => (
                      <article
                        key={`${item.mealType}_${item.slotIndex}_${item.mealId}`}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                      >
                        <p className="text-sm font-semibold text-[var(--color-text)]">{item.meal.name}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {item.meal.calories} kcal • P {item.meal.protein}g • C {item.meal.carbs}g • F {item.meal.fat}g
                        </p>
                        <button
                          type="button"
                          onClick={() => router.push(`/user/meals/${item.meal.id}`)}
                          className="mt-3 rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                        >
                          Open details
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))
          : null}
      </div>
    </div>
  );
}
