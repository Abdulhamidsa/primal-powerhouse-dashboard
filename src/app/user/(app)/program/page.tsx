'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flame, Utensils } from 'lucide-react';
import { MealCard } from '@/app/user/(app)/meals/_components/MealCard';
import { useUserMeals } from '@/app/user/(app)/meals/_hooks/useUserMeals';
import { MEAL_TYPES } from '@/app/user/(app)/meals';
import { SkeletonMealGrid } from '@/components/Skeletons';
import { UserTrainingAssignments } from '@/features/training/components/UserTrainingAssignments';

type ProgramTab = 'meals' | 'training';
type MealViewMode = 'today' | 'all';
type MealType = (typeof MEAL_TYPES)[number];

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snacks',
};

function MealsProgramPanel() {
  const router = useRouter();
  const { sections, isLoading, error, emptyState, getDayName } = useUserMeals();

  const [mealViewMode, setMealViewMode] = useState<MealViewMode>('all');
  const [activeMealType, setActiveMealType] = useState<'ALL' | MealType>('ALL');

  const filteredMeals = useMemo(() => {
    if (activeMealType === 'ALL') {
      return sections.flatMap(section => section.items);
    }

    return sections.find(section => section.type === activeMealType)?.items || [];
  }, [sections, activeMealType]);

  const todaySections = useMemo(() => {
    if (activeMealType === 'ALL') {
      return sections;
    }

    return sections.filter(section => section.type === activeMealType);
  }, [sections, activeMealType]);

  const hasTodayContent = todaySections.some(section => section.items.length > 0);

  const chipOptions: Array<{ key: 'ALL' | MealType; label: string }> = [
    { key: 'ALL', label: 'All' },
    ...MEAL_TYPES.map(type => ({
      key: type,
      label: MEAL_TYPE_LABELS[type],
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setMealViewMode('today')}
              className={[
                'inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition-all',
                mealViewMode === 'today'
                  ? 'bg-[var(--color-accent-translucent)] text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text)]',
              ].join(' ')}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setMealViewMode('all')}
              className={[
                'inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition-all',
                mealViewMode === 'all'
                  ? 'bg-[var(--color-accent-translucent)] text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text)]',
              ].join(' ')}
            >
              All meals
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chipOptions.map(option => (
              <button
                key={option.key}
                type="button"
                onClick={() => setActiveMealType(option.key)}
                className={[
                  'shrink-0 rounded-full border px-4 py-2 text-xs font-medium whitespace-nowrap transition-all',
                  activeMealType === option.key
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-translucent)] text-[var(--color-text)] shadow-sm'
                    : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] hover:border-[var(--color-accent-muted)] hover:text-[var(--color-text)]',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? <SkeletonMealGrid /> : null}

      {error ? (
        <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
          <p className="text-sm text-[var(--color-accent)]">Failed to load meals: {error.message}</p>
        </div>
      ) : null}

      {!isLoading && !error && mealViewMode === 'today' ? (
        <>
          {!hasTodayContent ? (
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                {activeMealType === 'ALL'
                  ? emptyState
                  : `No ${MEAL_TYPE_LABELS[activeMealType].toLowerCase()} meals assigned today.`}
              </p>
            </div>
          ) : (
            todaySections
              .filter(section => section.items.length > 0)
              .map(section => (
                <section key={section.type} className="space-y-3">
                  <div className="flex items-end justify-between">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                      {MEAL_TYPE_LABELS[section.type as MealType]}
                    </h2>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {section.items.length} item{section.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map(assignment => (
                      <MealCard
                        key={assignment.id}
                        assignment={assignment}
                        getDayName={getDayName}
                        onOpen={() => router.push(`/user/meals/${assignment.meal.id}`)}
                      />
                    ))}
                  </div>
                </section>
              ))
          )}
        </>
      ) : null}

      {!isLoading && !error && mealViewMode === 'all' ? (
        <>
          {filteredMeals.length === 0 ? (
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                {activeMealType === 'ALL'
                  ? 'No meals assigned yet.'
                  : `No ${MEAL_TYPE_LABELS[activeMealType].toLowerCase()} meals assigned yet.`}
              </p>
            </div>
          ) : (
            <section className="space-y-3">
              <div className="flex items-end justify-between">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  {activeMealType === 'ALL' ? 'All meals' : MEAL_TYPE_LABELS[activeMealType]}
                </h2>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {filteredMeals.length} item{filteredMeals.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMeals.map(assignment => (
                  <MealCard
                    key={assignment.id}
                    assignment={assignment}
                    getDayName={getDayName}
                    onOpen={() => router.push(`/user/meals/${assignment.meal.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}

export default function UserProgramPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'training' ? 'training' : 'meals';
  const [activeTab, setActiveTab] = useState<ProgramTab>(initialTab);

  return (
    <div className="px-4 pb-8 pt-4 md:px-5">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <section className="relative overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div
            className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full blur-3xl"
            style={{ background: 'var(--color-accent-translucent)' }}
          />

          <div className="relative flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
              {activeTab === 'meals' ? <Utensils size={18} /> : <Flame size={18} />}
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">Program</h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Meals and training in one place.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('meals')}
                className={[
                  'inline-flex items-center justify-center gap-2 rounded-[18px] px-3 py-3 text-sm font-medium transition-all',
                  activeTab === 'meals'
                    ? 'bg-[var(--color-accent-translucent)] text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text)]',
                ].join(' ')}
                aria-pressed={activeTab === 'meals'}
              >
                <Utensils size={16} />
                <span>Meals</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('training')}
                className={[
                  'inline-flex items-center justify-center gap-2 rounded-[18px] px-3 py-3 text-sm font-medium transition-all',
                  activeTab === 'training'
                    ? 'bg-[var(--color-accent-translucent)] text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text)]',
                ].join(' ')}
                aria-pressed={activeTab === 'training'}
              >
                <Flame size={16} />
                <span>Training</span>
              </button>
            </div>
          </div>

          {activeTab === 'meals' ? <MealsProgramPanel /> : <UserTrainingAssignments showHeader={false} />}
        </section>
      </div>
    </div>
  );
}