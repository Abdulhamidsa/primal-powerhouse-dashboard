import React from 'react';
import Image from 'next/image';
import { Apple, Clock, Edit, Moon, Sun, Sunrise, Users, Trash2, Flame, Drumstick, Wheat, Droplets } from 'lucide-react';
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
  const macros = [
    { label: 'Calories', value: meal.calories, icon: Flame, color: 'text-orange-400' },
    { label: 'Protein', value: `${meal.protein}g`, icon: Drumstick, color: 'text-emerald-400' },
    { label: 'Carbs', value: `${meal.carbs}g`, icon: Wheat, color: 'text-amber-300' },
    { label: 'Fat', value: `${meal.fat}g`, icon: Droplets, color: 'text-sky-400' },
  ];

  return (
    <div onClick={() => onViewMeal(meal)} className="card-base overflow-hidden cursor-pointer">
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
            className="object-cover"
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

        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-2 py-1 text-xs font-medium text-[var(--color-text)] backdrop-blur">
            {meal.type === 'BREAKFAST' && <Sunrise className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            {meal.type === 'LUNCH' && <Sun className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            {meal.type === 'DINNER' && <Moon className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            {meal.type === 'SNACK' && <Apple className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            {meal.type.charAt(0) + meal.type.slice(1).toLowerCase()}
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="mb-3 truncate text-lg font-semibold text-[var(--color-text)]">{meal.name}</h3>
        <div className="mb-3">
          <div className="mb-2">
            <p className="text-xs text-[var(--color-text-muted)]">Calories</p>
            <p className="text-2xl font-semibold text-orange-400">{meal.calories}</p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--color-text-muted)]">
            {macros
              .filter(m => m.label !== 'Calories')
              .map(m => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${m.color}`} />
                    <span>{m.label}</span>
                    <span className={`font-medium ${m.color}`}>{m.value}</span>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {meal.prepTime + meal.cookTime} min
          </span>

          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {meal.servings} serving{meal.servings > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {meal.tags.slice(0, 3).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-2 py-1 text-xs text-[var(--color-text-muted)]"
            >
              {tag}
            </span>
          ))}

          {meal.tags.length > 3 && (
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-2 py-1 text-xs text-[var(--color-text-muted)]">
              +{meal.tags.length - 3}
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-2 border-t border-[var(--color-border)] pt-4">
          <Button
            onClick={e => {
              e.stopPropagation();
              onEditMeal(meal.id);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>

          <Button
            onClick={e => {
              e.stopPropagation();
              onDeleteMeal(meal.id);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
