'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Clock, Sparkles, Users, Wheat, Flame } from 'lucide-react';
import { useMealDetail } from '@/features/meals/hooks/useMealDetail';
import { normalizeMealTextList } from '@/features/meals/utils/mealText';
import { getMealImageDelivery } from '@/features/meals/utils/mealImageDelivery';

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mealId = typeof params?.mealId === 'string' ? params.mealId : undefined;
  const { meal, error, isLoading } = useMealDetail(mealId);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'spices' | 'instructions'>('ingredients');

  const formatDuration = (minutes?: number | null) => {
    if (!minutes || minutes <= 0) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
  };

  const fallback = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=60';
  const imageSrc = meal?.imageUrl?.trim() ? meal.imageUrl : fallback;
  const image = getMealImageDelivery(imageSrc, 'detail');

  const totalTime = useMemo(() => {
    if (!meal) return 0;
    return (meal.prepTime ?? 0) + (meal.cookTime ?? 0);
  }, [meal]);

  const ingredientsList = useMemo(() => normalizeMealTextList(meal?.ingredients), [meal?.ingredients]);
  const spicesList = useMemo(() => normalizeMealTextList(meal?.spices), [meal?.spices]);
  const instructionsList = useMemo(() => normalizeMealTextList(meal?.instructions), [meal?.instructions]);

  if (isLoading) {
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

  if (error || !meal) {
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
              src={image.src}
              alt={meal.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 900px"
              priority={false}
              unoptimized={image.unoptimized}
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

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <StatCard label="Meal type" value={meal.type || 'Meal'} />
              <StatCard label="Total time" value={`${totalTime > 0 ? `${totalTime}m` : 'N/A'}`} />
              <StatCard label="Servings" value={`${meal.servings}`} />
            </div>

            <div className="mt-3">
              <StatRow
                icon={<Clock size={14} />}
                label="Prep / cook"
                value={`${formatDuration(meal.prepTime)} / ${formatDuration(meal.cookTime)}`}
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-3xl border border-border bg-card p-4 md:p-6">
          <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('ingredients')}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
              style={{
                borderColor: activeTab === 'ingredients' ? 'var(--color-accent)' : 'var(--color-border)',
                color: activeTab === 'ingredients' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: activeTab === 'ingredients' ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
              }}
            >
              <Wheat size={14} />
              Ingredients
            </button>

            {spicesList.length > 0 ? (
              <button
                type="button"
                onClick={() => setActiveTab('spices')}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{
                  borderColor: activeTab === 'spices' ? 'var(--color-accent)' : 'var(--color-border)',
                  color: activeTab === 'spices' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  background: activeTab === 'spices' ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
                }}
              >
                <Sparkles size={14} />
                Spices
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setActiveTab('instructions')}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
              style={{
                borderColor: activeTab === 'instructions' ? 'var(--color-accent)' : 'var(--color-border)',
                color: activeTab === 'instructions' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: activeTab === 'instructions' ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
              }}
            >
              <Flame size={14} />
              Instructions
            </button>
          </div>

          <div className="mt-3 rounded-2xl border border-border bg-background p-4">
            {activeTab === 'ingredients' ? (
              <ListBlock title="Ingredients" items={ingredientsList} emptyState="No ingredients provided." />
            ) : null}

            {activeTab === 'spices' ? (
              <ListBlock title="Spices" items={spicesList} emptyState="No spices provided." />
            ) : null}

            {activeTab === 'instructions' ? (
              <ListBlock
                title="Instructions"
                items={instructionsList}
                emptyState="No instructions provided."
                numbered
              />
            ) : null}
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

function ListBlock({
  title,
  items,
  emptyState,
  numbered = false,
}: {
  title: string;
  items: string[];
  emptyState: string;
  numbered?: boolean;
}) {
  return (
    <>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="mt-3">
        {items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={`${item}-${index}`} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted/30 text-[11px] text-muted-foreground">
                  {numbered ? index + 1 : '\u2022'}
                </span>
                <span className="text-sm leading-relaxed text-foreground/90">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyState}</p>
        )}
      </div>
    </>
  );
}
