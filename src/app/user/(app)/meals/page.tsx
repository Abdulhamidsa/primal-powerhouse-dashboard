'use client';

import { useRouter } from 'next/navigation';
import { MealCard } from './_components/MealCard';
import { MEAL_TYPES } from '.';
import { SkeletonMealGrid } from '@/components/Skeletons';
import { useUserMeals } from './_hooks/useUserMeals';

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snacks',
};

export default function UserMealsPage() {
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

  // Get filtered meals for the currently selected meal type
  const filteredMeals = sections.find(s => s.type === activeMealType)?.items || [];

  return (
    <div className="px-4 py-6 md:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">My Meals</h1>
            <p className="text-sm text-muted-foreground">Tap a meal for the full recipe.</p>
          </div>

          <div className="rounded-full border border-border bg-muted/50 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={[
                'px-4 py-2 text-sm rounded-full transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                activeTab === 'today'
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
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
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                activeTab === 'all'
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              All
            </button>
          </div>
        </div>

        {/* Today view */}
        {activeTab === 'today' && (
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
                  <h2 className="text-lg font-semibold text-foreground">{MEAL_TYPE_LABELS[section.type]}</h2>
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
        )}

        {/* All view with meal type tabs */}
        {activeTab === 'all' && (
          <>
            {/* Meal type tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {(MEAL_TYPES as readonly string[]).map(mealType => (
                <button
                  key={mealType}
                  onClick={() => setActiveMealType(mealType as any)}
                  className={[
                    'px-4 py-2 text-sm rounded-full whitespace-nowrap transition-all flex-shrink-0',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    activeMealType === mealType
                      ? 'bg-background border border-accent text-foreground shadow'
                      : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20',
                  ].join(' ')}
                >
                  {MEAL_TYPE_LABELS[mealType]}
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
                  No {MEAL_TYPE_LABELS[activeMealType].toLowerCase()} meals assigned yet.
                </p>
              </div>
            ) : null}

            {filteredMeals.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-end justify-between">
                  <h2 className="text-lg font-semibold text-foreground">{MEAL_TYPE_LABELS[activeMealType]}</h2>
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
