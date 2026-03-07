'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Clock, Users, Flame, Wheat, Droplets } from 'lucide-react';

interface Meal {
  id: string;
  name: string;
  type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  ingredients?: unknown;
  instructions?: unknown;
  prepTime?: number;
  cookTime?: number;
  servings: number;
  imageUrl?: string;
}

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.mealId) return;
    fetchMealDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.mealId]);

  const fetchMealDetails = async () => {
    try {
      const response = await fetch(`/api/meals/${params.mealId}`);
      if (!response.ok) {
        setMeal(null);
        return;
      }
      const data = await response.json();
      setMeal(data);
    } catch (error) {
      console.error('Error fetching meal details:', error);
      setMeal(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes || minutes <= 0) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
  };

  const fallback = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=60';

  const imageSrc = meal?.imageUrl?.trim() ? meal.imageUrl : fallback;

  const totalTime = useMemo(() => {
    if (!meal) return 0;
    return (meal.prepTime ?? 0) + (meal.cookTime ?? 0);
  }, [meal]);

  const ingredientsList = useMemo(() => normalizeToList(meal?.ingredients), [meal?.ingredients]);
  const instructionsList = useMemo(() => normalizeToList(meal?.instructions), [meal?.instructions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="h-6 w-36 rounded-md bg-muted/40" />
          <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card">
            <div className="h-56 w-full bg-muted/40" />
            <div className="p-6 space-y-4">
              <div className="h-8 w-2/3 rounded-md bg-muted/40" />
              <div className="h-4 w-1/2 rounded-md bg-muted/40" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-16 rounded-2xl bg-muted/40" />
                <div className="h-16 rounded-2xl bg-muted/40" />
                <div className="h-16 rounded-2xl bg-muted/40" />
                <div className="h-16 rounded-2xl bg-muted/40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8 text-center">
          <h3 className="text-xl font-semibold text-foreground">Meal not found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The meal you are looking for does not exist or could not be loaded.
          </p>

          <button
            onClick={() => router.back()}
            className="mt-6 inline-flex items-center justify-center rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={18} />
          Back to meals
        </button>

        {/* Header Card */}
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          {/* Hero image */}
          <div className="relative h-60 w-full md:h-72">
            <Image
              src={imageSrc}
              alt={meal.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 900px"
              priority={false}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Top chips */}
            <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
              <span className="max-w-[70%] truncate rounded-full bg-black/35 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
                {meal.type || 'Meal'}
              </span>

              {totalTime > 0 ? (
                <span className="shrink-0 rounded-full bg-black/35 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
                  {totalTime}m total
                </span>
              ) : null}
            </div>

            {/* Title */}
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl font-semibold text-white md:text-3xl">{meal.name}</h1>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Meta chips */}
            <div className="flex flex-wrap gap-2">
              <MetaChip icon={<Clock size={12} />} label={`Prep ${formatDuration(meal.prepTime)}`} />
              <MetaChip icon={<Clock size={12} />} label={`Cook ${formatDuration(meal.cookTime)}`} />
              <MetaChip icon={<Users size={12} />} label={`${meal.servings} servings`} />
            </div>

            {/* Stats */}
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Calories" value={`${meal.calories}`} />
              <StatCard label="Protein" value={`${meal.protein}g`} />
              <StatCard label="Carbs" value={`${meal.carbs}g`} />
              <StatCard label="Fat" value={`${meal.fat}g`} />
            </div>

            {meal.fiber !== undefined ? (
              <div className="mt-3">
                <StatRow icon={<Droplets size={14} />} label="Fiber" value={`${meal.fiber}g`} />
              </div>
            ) : null}
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Ingredients */}
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-muted/40">
                <Wheat size={18} className="text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Ingredients</h2>
            </div>

            <div className="mt-4">
              {ingredientsList.length > 0 ? (
                <ul className="space-y-3">
                  {ingredientsList.map((item, idx) => (
                    <li key={`${item}-${idx}`} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted/30 text-[11px] text-muted-foreground">
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No ingredients provided.</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-muted/40">
                <Flame size={18} className="text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Instructions</h2>
            </div>

            <div className="mt-4">
              {instructionsList.length > 0 ? (
                <ol className="space-y-4">
                  {instructionsList.map((step, idx) => (
                    <li key={`${step}-${idx}`} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground">
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-foreground/90">{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No instructions provided.</p>
              )}
            </div>
          </div>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function normalizeToList(value?: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap(item => normalizeObjectOrPrimitive(item)).filter(Boolean);
  }

  if (typeof value === 'object') {
    return normalizeObjectOrPrimitive(value);
  }

  const raw = String(value).trim();
  if (!raw) return [];

  // Try to split common formats:
  // - newline separated
  // - "1) step" or "1. step"
  // - comma separated fallback
  const lines = raw
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  const numbered = raw
    .split(/(?:\r?\n)?\s*\d+[\).\:-]\s+/g)
    .map(s => s.trim())
    .filter(Boolean);

  if (numbered.length > 1) return numbered;

  const comma = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return comma.length > 1 ? comma : [raw];
}

function normalizeObjectOrPrimitive(item: unknown): string[] {
  if (item === null || item === undefined) return [];

  if (typeof item === 'string') {
    const trimmed = item.trim();
    return trimmed ? [trimmed] : [];
  }

  if (typeof item === 'number' || typeof item === 'boolean') {
    return [String(item)];
  }

  if (typeof item !== 'object') return [];

  const record = item as Record<string, unknown>;

  const instruction = toCleanString(record.instruction);
  if (instruction) return [instruction];

  const name = toCleanString(record.name);
  const amount = toCleanString(record.amount);
  const unit = toCleanString(record.unit);
  const notes = toCleanString(record.notes);

  const base = [amount, unit, name].filter(Boolean).join(' ').trim();
  if (base) {
    return [notes ? `${base} (${notes})` : base];
  }

  const fallback = Object.values(record)
    .map(value => (typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''))
    .filter(Boolean)
    .join(' - ');

  return fallback ? [fallback] : [];
}

function toCleanString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}
