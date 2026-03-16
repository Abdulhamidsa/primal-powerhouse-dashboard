import React from 'react';
import Image from 'next/image';
import { Apple, Clock, Edit, Moon, Sun, Sunrise, Users, Trash2, Flame, Beef } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/cloudinary';
import { MealListItem } from '@/lib/meal-planner/types';

type MealCardProps = {
  meal: MealListItem;
  onViewMeal: (meal: MealListItem) => void;
  onEditMeal: (mealId: string) => void;
  onDeleteMeal: (mealId: string) => void;
};

export const MealCard = ({ meal, onViewMeal, onEditMeal, onDeleteMeal }: MealCardProps) => {
  return (
    <div onClick={() => onViewMeal(meal)} className="card-base overflow-hidden cursor-pointer flex flex-col">
      <div className="relative h-44 w-full">
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
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--color-bg-alt)]">
            <span className="text-sm text-[var(--color-text-muted)]">No image</span>
          </div>
        )}

        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur px-2.5 py-1 text-xs font-medium text-[var(--color-text)]">
            {meal.type === 'BREAKFAST' && <Sunrise className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            {meal.type === 'LUNCH' && <Sun className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            {meal.type === 'DINNER' && <Moon className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            {meal.type === 'SNACK' && <Apple className="h-3.5 w-3.5 text-[var(--color-accent)]" />}
            {meal.type.charAt(0) + meal.type.slice(1).toLowerCase()}
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">{meal.name}</h3>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[var(--color-accent)]" />
              <div className="flex flex-col leading-tight">
                <span className="text-[var(--color-text-muted)] text-xs">Calories</span>
                <span className="font-semibold text-[var(--color-text)]">{meal.calories}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Beef className="h-4 w-4 text-[var(--color-accent)]" />
              <div className="flex flex-col leading-tight">
                <span className="text-[var(--color-text-muted)] text-xs">Protein</span>
                <span className="font-semibold text-[var(--color-text)]">{meal.protein}g</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
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

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-2 flex gap-2">
          <button
            onClick={e => {
              e.stopPropagation();
              onEditMeal(meal.id);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>

          <div className="w-px bg-[var(--color-border)]" />

          <button
            onClick={e => {
              e.stopPropagation();
              onDeleteMeal(meal.id);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
