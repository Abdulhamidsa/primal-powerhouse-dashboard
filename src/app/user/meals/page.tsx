'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Clock, Users, ChefHat } from 'lucide-react';

interface MealAssignment {
  id: string;
  mealType: string;
  dayOfWeek: number;
  portion: number;
  scheduledTime?: string;
  meal: {
    id: string;
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: string;
    instructions: string;
    category: string;
    difficulty: string;
    prepTime: number;
    cookTime: number;
    servings: number;
    tags: string;
    imageUrl?: string;
  };
  mealPlan: {
    name: string;
  };
}

type Tab = 'today' | 'all';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

export default function UserMealsPage() {
  const router = useRouter();
  const [todaysMeals, setTodaysMeals] = useState<Record<string, MealAssignment | undefined>>({});
  const [allMealAssignments, setAllMealAssignments] = useState<MealAssignment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  useEffect(() => {
    fetchTodaysMeals();
    fetchAllMealAssignments();
  }, []);

  const fetchTodaysMeals = async () => {
    try {
      const response = await fetch('/api/user/meals/today');
      if (!response.ok) return;
      const data = await response.json();
      setTodaysMeals(data);
    } catch (error) {
      console.error("Error fetching today's meals:", error);
    }
  };

  const fetchAllMealAssignments = async () => {
    try {
      const response = await fetch('/api/user/meals');
      if (!response.ok) return;
      const data = await response.json();
      setAllMealAssignments(data);
    } catch (error) {
      console.error('Error fetching all meal assignments:', error);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const mealSections = useMemo(() => {
    const source =
      activeTab === 'today'
        ? (Object.values(todaysMeals).filter(Boolean) as MealAssignment[])
        : allMealAssignments;

    return MEAL_TYPES
      .map(type => ({
        type,
        items: source.filter(a => a.mealType?.toUpperCase() === type),
      }))
      .filter(section => section.items.length > 0);
  }, [activeTab, todaysMeals, allMealAssignments]);

  const emptyState = activeTab === 'today' ? 'No meals for today yet.' : 'No meals assigned yet.';

  return (
    <div className="px-4 py-6 md:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">My Meals</h1>
            <p className="text-sm text-muted-foreground">Tap a meal for the full recipe.</p>
          </div>

          {/* iOS segmented control */}
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
              onClick={() => setActiveTab('all')}
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

        {/* Empty */}
        {mealSections.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">{emptyState}</p>
          </div>
        ) : null}

        {/* Sections */}
        {mealSections.map(section => (
          <section key={section.type} className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {section.type.charAt(0) + section.type.slice(1).toLowerCase()}
              </h2>
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
      </div>
    </div>
  );
}

function MealCard({
  assignment,
  getDayName,
  onOpen,
}: {
  assignment: MealAssignment;
  getDayName: (d: number) => string;
  onOpen: () => void;
}) {
  const totalTime = (assignment.meal.prepTime ?? 0) + (assignment.meal.cookTime ?? 0);

  const fallback =
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=60';

  const imageSrc = assignment.meal.imageUrl?.trim() ? assignment.meal.imageUrl : fallback;

  const subtitleLeft = `${getDayName(assignment.dayOfWeek)} • ${assignment.mealPlan.name}`;
  const subtitleRight = assignment.scheduledTime ? assignment.scheduledTime : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => (e.key === 'Enter' ? onOpen() : null)}
      className={[
        'group overflow-hidden rounded-3xl border border-border bg-card',
        'transition-all hover:-translate-y-[1px] hover:shadow-md active:translate-y-0',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      ].join(' ')}
    >
      {/* Image (always) */}
      <div className="relative h-44 w-full">
        <Image
          src={imageSrc}
          alt={assignment.meal.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={false}
        />

        {/* iOS-like soft overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        {/* Top-right tiny icon */}
        <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-black/35 backdrop-blur">
          <ChefHat size={16} className="text-white/90" />
        </div>

        {/* Bottom chips */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="truncate rounded-full bg-black/35 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
            {subtitleLeft}
          </span>

          {subtitleRight ? (
            <span className="shrink-0 rounded-full bg-black/35 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
              {subtitleRight}
            </span>
          ) : null}
        </div>
      </div>

      {/* Minimal content */}
      <div className="p-4">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-foreground">
            {assignment.meal.name}
          </h3>

          {assignment.meal.description ? (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {assignment.meal.description}
            </p>
          ) : null}
        </div>

        {/* Only important meta */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <MetaChip icon={<Clock size={12} />} label={`${totalTime}m`} />
          <MetaChip icon={<Users size={12} />} label={`${assignment.meal.servings} servings`} />
          <MetaChip label={assignment.meal.difficulty} />
        </div>
      </div>
    </div>
  );
}

function MetaChip({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground">
      {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      <span className="leading-none">{label}</span>
    </span>
  );
}
