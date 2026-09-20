import React from 'react';
import Image from 'next/image';
import {
  Apple,
  Clock,
  Drumstick,
  Droplets,
  Edit,
  Flame,
  Leaf,
  Moon,
  Sun,
  Sunrise,
  Trash2,
  Users,
  Wheat,
} from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/cloudinary';
import { MealListItem } from '@/lib/meal-planner/types';
import { Button } from '@/components/ui/button';

type MealCardProps = {
  meal: MealListItem;
  onViewMeal: (meal: MealListItem) => void;
  onEditMeal: (mealId: string) => void;
  onDeleteMeal: (mealId: string) => void;
};

export const MealCard = ({ meal, onViewMeal, onEditMeal, onDeleteMeal }: MealCardProps) => {
  const totalTime = (Number(meal.prepTime) || 0) + (Number(meal.cookTime) || 0);
  const macros = [
    { label: 'Calories', value: Number(meal.calories) || 0, icon: Flame, color: 'text-orange-400' },
    { label: 'Protein', value: `${Number(meal.protein) || 0}g`, icon: Drumstick, color: 'text-emerald-400' },
    { label: 'Carbs', value: `${Number(meal.carbs) || 0}g`, icon: Wheat, color: 'text-amber-300' },
    { label: 'Fat', value: `${Number(meal.fat) || 0}g`, icon: Droplets, color: 'text-sky-400' },
  ];

  return (
    <article
      onClick={() => onViewMeal(meal)}
      className="group cursor-pointer overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.035] shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.055]"
    >
      <div className="relative h-48 w-full">
        {meal.imageUrl && meal.imageUrl.trim() !== '' ? (
          <Image
            src={
              meal.imageUrl.includes('cloudinary.com')
                ? getOptimizedImageUrl(meal.imageUrl.split('/upload/')[1] || meal.imageUrl, 'card')
                : meal.imageUrl
            }
            alt={meal.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
            onError={e => {
              e.currentTarget.src = 'https://picsum.photos/800/600?food';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--color-bg-alt)]">
            <span className="text-sm text-[var(--color-text-muted)]">No image</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />

        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {meal.type === 'BREAKFAST' && <Sunrise className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            {meal.type === 'LUNCH' && <Sun className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            {meal.type === 'DINNER' && <Moon className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            {meal.type === 'SNACK' && <Apple className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            {meal.type === 'SIDES' && <Leaf className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            {meal.type.charAt(0) + meal.type.slice(1).toLowerCase()}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="truncate text-lg font-semibold tracking-[-0.02em] text-foreground">{meal.name}</h3>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {macros.map(m => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-2xl border border-white/10 bg-black/18 px-2 py-2">
                <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  <Icon className={`h-3 w-3 ${m.color}`} />
                  <span className="truncate">{m.label === 'Calories' ? 'Kcal' : m.label}</span>
                </div>
                <p className={`truncate text-sm font-semibold ${m.color}`}>{m.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {totalTime} min
          </span>

          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {meal.servings} serving{meal.servings > 1 ? 's' : ''}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(meal.tags || []).slice(0, 3).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}

          {(meal.tags || []).length > 3 && (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-muted-foreground">
              +{(meal.tags || []).length - 3}
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
          <Button
            onClick={e => {
              e.stopPropagation();
              onEditMeal(meal.id);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.08]"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>

          <Button
            onClick={e => {
              e.stopPropagation();
              onDeleteMeal(meal.id);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
};
