'use client';

import { useRouter } from 'next/navigation';
import { useUserMeals } from '@/app/user/meals/_hooks/useUserMeals';
import { MealCard } from './_components/MealCard';

export default function UserMealsPage() {
  const router = useRouter();
  const { activeTab, setActiveTab, sections, isLoading, error, emptyState, getDayName } = useUserMeals();

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
              className={['px-4 py-2 text-sm rounded-full transition-all', 'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', activeTab === 'today' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'].join(' ')}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={['px-4 py-2 text-sm rounded-full transition-all', 'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', activeTab === 'all' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'].join(' ')}
            >
              All
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">Loading meals…</p>
          </div>
        ) : null}

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
              <h2 className="text-lg font-semibold text-foreground">{section.type.charAt(0) + section.type.slice(1).toLowerCase()}</h2>
              <span className="text-xs text-muted-foreground">
                {section.items.length} item{section.items.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map(assignment => (
                <MealCard key={assignment.id} assignment={assignment} getDayName={getDayName} onOpen={() => router.push(`/user/meals/${assignment.meal.id}`)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
