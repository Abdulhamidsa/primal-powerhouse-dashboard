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

type MealType = (typeof MEAL_TYPES)[number];

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snacks',
};

function MealsProgramPanel() {
  const router = useRouter();
  const {
    activeTab,
    setActiveTab,
    activeMealType,
    setActiveMealType,
    sections,
    isLoading,
    error,
    emptyState,
    getDayName,
  } = useUserMeals();

  const filteredMeals = useMemo(
    () => sections.find(s => s.type === activeMealType)?.items || [],
    [sections, activeMealType]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-full border border-border bg-muted/50 p-1 shadow-sm w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={[
            'px-4 py-2 text-sm rounded-full transition-all',
            activeTab === 'today' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('all');
            setActiveMealType('BREAKFAST');
          }}
          className={[
            'px-4 py-2 text-sm rounded-full transition-all',
            activeTab === 'all' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          All
        </button>
      </div>

      {activeTab === 'today' ? (
        <>
          {isLoading ? <SkeletonMealGrid /> : null}

          {error ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-sm text-destructive">Failed to load meals: {error.message}</p>
            </div>
          ) : null}

          {!isLoading && !error && sections.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">{emptyState}</p>
            </div>
          ) : null}

          {sections.map(section => (
            <section key={section.type} className="space-y-3">
              <div className="flex items-end justify-between">
                <h2 className="text-lg font-semibold text-foreground">{MEAL_TYPE_LABELS[section.type as MealType]}</h2>
                <span className="text-xs text-muted-foreground">
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
          ))}
        </>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {(MEAL_TYPES as readonly string[]).map(mealType => (
              <button
                key={mealType}
                onClick={() => setActiveMealType(mealType as MealType)}
                className={[
                  'px-4 py-2 text-sm rounded-full whitespace-nowrap transition-all flex-shrink-0',
                  activeMealType === mealType
                    ? 'bg-background border border-accent text-foreground shadow'
                    : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20',
                ].join(' ')}
              >
                {MEAL_TYPE_LABELS[mealType as MealType]}
              </button>
            ))}
          </div>

          {isLoading ? <SkeletonMealGrid /> : null}

          {error ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-sm text-destructive">Failed to load meals: {error.message}</p>
            </div>
          ) : null}

          {!isLoading && !error && filteredMeals.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No {MEAL_TYPE_LABELS[activeMealType as MealType].toLowerCase()} meals assigned yet.
              </p>
            </div>
          ) : null}

          {filteredMeals.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-end justify-between">
                <h2 className="text-lg font-semibold text-foreground">{MEAL_TYPE_LABELS[activeMealType as MealType]}</h2>
                <span className="text-xs text-muted-foreground">
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
          ) : null}
        </>
      )}
    </div>
  );
}

export default function UserProgramPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'training' ? 'training' : 'meals';
  const [activeTab, setActiveTab] = useState<ProgramTab>(initialTab);

  return (
    <div className="px-4 pb-8 pt-4 md:px-5">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="relative overflow-hidden rounded-[30px] border border-border/70 bg-card/95 p-5 shadow-sm">
          <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Utensils size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Program</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Switch between nutrition and training without leaving the page.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-background/60 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('meals')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === 'meals'
                    ? 'bg-accent/20 text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                }`}
                aria-pressed={activeTab === 'meals'}
              >
                <Utensils size={16} />
                <span>Meals</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('training')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === 'training'
                    ? 'bg-accent/20 text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                }`}
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
