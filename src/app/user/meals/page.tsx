'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Clock, Users, ChefHat } from '../../../../node_modules/lucide-react';

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: number;
  scheduledTime?: string;
  mealPlan: string;
  assignmentId?: string;
  mealType?: string;
}

interface TodaysMeals {
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  snack?: Meal;
}

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

export default function UserMealsPage() {
  const router = useRouter();
  const [todaysMeals, setTodaysMeals] = useState<Record<string, MealAssignment | undefined>>({});
  const [allMealAssignments, setAllMealAssignments] = useState<MealAssignment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('today');

  useEffect(() => {
    fetchTodaysMeals();
    fetchAllMealAssignments();
  }, []);

  const fetchTodaysMeals = async () => {
    try {
      const response = await fetch('/api/user/meals/today');
      if (response.ok) {
        const data = await response.json();
        setTodaysMeals(data);
      }
    } catch (error) {
      console.error("Error fetching today's meals:", error);
    }
  };

  const fetchAllMealAssignments = async () => {
    try {
      const response = await fetch('/api/user/meals');
      if (response.ok) {
        const data = await response.json();
        setAllMealAssignments(data);
      }
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
      activeTab === 'today' ? (Object.values(todaysMeals).filter(Boolean) as MealAssignment[]) : allMealAssignments;

    const types = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

    return types
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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">My Meals</h1>
            <p className="text-sm text-muted-foreground">Your plan, clean and simple.</p>
          </div>

          {/* iOS segmented control */}
          <div className="rounded-full border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={[
                'px-4 py-2 text-sm rounded-full transition-all',
                activeTab === 'today'
                  ? 'bg-background shadow-sm text-foreground'
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
                activeTab === 'all'
                  ? 'bg-background shadow-sm text-foreground'
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

  const fallback = `https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=60`;
  const imageSrc = assignment.meal.imageUrl || fallback;

  const tags = assignment.meal.tags
    ? assignment.meal.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .slice(0, 2)
    : [];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => (e.key === 'Enter' ? onOpen() : null)}
      className={[
        'group overflow-hidden rounded-2xl border border-border bg-card',
        'transition-all hover:-translate-y-[1px] hover:shadow-md active:translate-y-0',
      ].join(' ')}
    >
      {/* Image */}
      <div className="hidden md:block">
        <div className="relative h-40 w-full">
          <Image
            src={imageSrc}
            alt={assignment.meal.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 33vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white backdrop-blur">
              {getDayName(assignment.dayOfWeek)} • {assignment.mealPlan.name}
            </span>
            {assignment.scheduledTime ? (
              <span className="rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white backdrop-blur">
                {assignment.scheduledTime}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors">
              {assignment.meal.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{assignment.meal.description}</p>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40">
            <ChefHat size={16} className="text-muted-foreground" />
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {totalTime}m
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={12} />
            {assignment.meal.servings}
          </span>
          <span className="ml-auto rounded-full border border-border bg-muted/30 px-2 py-1">
            {assignment.meal.difficulty}
          </span>
        </div>

        {/* Tags */}
        {tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {/* CTA */}
        <div className="mt-4">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onOpen();
            }}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
          >
            View details
          </button>
        </div>
      </div>
    </div>
  );
}
