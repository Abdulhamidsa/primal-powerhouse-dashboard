'use client';

import { Meal } from '@/types/meal';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Clock, Users, Utensils, Sunrise, Sun, Moon, Apple, Sparkles, Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import AdvancedMealPersonalization from './AdvancedMealPersonalization';
import AssignMealModal from './AssignMealModal';

interface MealDetailModalProps {
  meal: Meal | null;
  isOpen: boolean;
  onCloseAction: () => void;
  onEditAction?: (meal: Meal) => void;
  onDeleteAction?: (mealId: string) => void;
}

export default function NewMealDetailModal({
  meal,
  isOpen,
  onCloseAction,
  onEditAction,
  onDeleteAction,
}: MealDetailModalProps) {
  const [personalizeModalOpen, setPersonalizeModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedClientId] = useState<string | undefined>(undefined);

  const handleSavePersonalizedMeal = async (personalizedMeal: any, clientId?: string): Promise<void> => {
    console.log('Saving personalized meal:', personalizedMeal);
    console.log('For client ID:', clientId || 'No client selected');
    // In a real app, you would call your service to save the personalized meal
    // For example: PersonalizedMealService.savePersonalizedMeal(personalizedMeal, clientId)
  };

  if (!meal) return null;
  const getMealTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return <Sunrise className="h-6 w-6" />;
      case 'lunch':
        return <Sun className="h-6 w-6" />;
      case 'dinner':
        return <Moon className="h-6 w-6" />;
      case 'snack':
        return <Apple className="h-6 w-6" />;
      default:
        return <Utensils className="h-6 w-6" />;
    }
  };

  const getMealTypeIconLarge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return <Sunrise className="h-16 w-16" />;
      case 'lunch':
        return <Sun className="h-16 w-16" />;
      case 'dinner':
        return <Moon className="h-16 w-16" />;
      case 'snack':
        return <Apple className="h-16 w-16" />;
      default:
        return <Utensils className="h-16 w-16" />;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onCloseAction}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden rounded-[30px] border border-white/10 bg-zinc-950/95 p-0 text-foreground shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:max-w-[820px]">
          <div className="flex max-h-[92vh] flex-col overflow-hidden">
            <div className="relative shrink-0">
              {meal.images && meal.images.length > 0 && meal.images[0] && meal.images[0].trim() !== '' ? (
                <div className="h-56 overflow-hidden sm:h-64">
                  <Image
                    src={meal.images[0]}
                    alt={meal.name}
                    className="h-full w-full object-cover"
                    width={900}
                    height={420}
                    onError={(e: any) => {
                      const imgElement = e.target as HTMLImageElement;
                      imgElement.src = 'https://picsum.photos/800/600?food';
                    }}
                  />
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center bg-[var(--color-bg-alt)] sm:h-64">
                  <div className="text-[var(--color-text-muted)]">{getMealTypeIconLarge(meal.type)}</div>
                </div>
              )}

              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-5">
                <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-3 py-1.5 text-xs font-medium text-[var(--color-text)] backdrop-blur">
                  <span className="inline-flex items-center gap-2">
                    {getMealTypeIcon(meal.type)}
                    {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <DialogTitle className="text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
                      {meal.name}
                    </DialogTitle>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">Meal details</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--color-text-muted)]">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-1.5">
                      <Clock className="h-4 w-4 text-[var(--color-accent)]" />
                      <span>Prep: {meal.prepTime} min</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-1.5">
                      <Clock className="h-4 w-4 text-[var(--color-accent)]" />
                      <span>Cook: {meal.cookTime} min</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-1.5">
                      <Users className="h-4 w-4 text-[var(--color-accent)]" />
                      <span>
                        {meal.servings} serving{meal.servings !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.14)] sm:p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="shrink-0">
                      <p className="text-xs text-[var(--color-text-muted)]">Calories</p>
                      <p className="text-4xl font-semibold text-orange-400">{meal.calories}</p>
                    </div>

                    <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-3xl">
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                        <p className="text-xs text-[var(--color-text-muted)]">Protein</p>
                        <p className="text-lg font-semibold text-emerald-400">{meal.protein}g</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                        <p className="text-xs text-[var(--color-text-muted)]">Carbs</p>
                        <p className="text-lg font-semibold text-amber-300">{meal.carbs}g</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                        <p className="text-xs text-[var(--color-text-muted)]">Fat</p>
                        <p className="text-lg font-semibold text-sky-400">{meal.fat}g</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                        <p className="text-xs text-[var(--color-text-muted)]">Fiber</p>
                        <p className="text-lg font-semibold text-green-400">{meal.fiber}g</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <section className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-[var(--color-accent)]" />
                      <h2 className="text-lg font-semibold text-[var(--color-text)]">Ingredients</h2>
                    </div>

                    <ul className="space-y-3">
                      {meal.ingredients.map((ingredient, index) => (
                        <li
                          key={index}
                            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
                        >
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-translucent)] text-sm font-medium text-[var(--color-accent)]">
                            {index + 1}
                          </span>

                          <span className="text-sm leading-6 text-[var(--color-text-muted)]">
                            {typeof ingredient === 'string'
                              ? ingredient
                              : `${ingredient.amount} ${ingredient.unit} ${ingredient.name}${ingredient.notes ? ` (${ingredient.notes})` : ''}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[var(--color-accent)]" />
                      <h2 className="text-lg font-semibold text-[var(--color-text)]">Instructions</h2>
                    </div>

                    <ol className="space-y-3">
                      {meal.instructions.map((instruction, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-medium text-[var(--color-text-on-accent)]">
                            {index + 1}
                          </span>

                          <span className="text-sm leading-6 text-[var(--color-text-muted)]">
                            {typeof instruction === 'string' ? instruction : instruction.instruction}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </section>
                </div>

                {meal.tags.length > 0 && (
                  <section className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                    <h3 className="mb-3 text-base font-semibold text-[var(--color-text)]">Tags</h3>

                    <div className="flex flex-wrap gap-2">
                      {meal.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <div className="flex flex-col gap-4 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-[var(--color-text-muted)]">ID: {meal.id.slice(0, 8)}...</div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPersonalizeModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-accent-translucent)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-translucent)]/80"
                    >
                      <Sparkles className="h-4 w-4" />
                      Personalize
                    </button>

                    <button
                      onClick={() => setAssignModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
                    >
                      <Users className="h-4 w-4" />
                      Assign
                    </button>

                    {onEditAction && (
                      <button
                        onClick={() => onEditAction(meal)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    )}

                    {onDeleteAction && (
                      <button
                        onClick={() => onDeleteAction(meal.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/15"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AdvancedMealPersonalization
        meal={meal}
        clientId={selectedClientId}
        isOpen={personalizeModalOpen}
        onCloseAction={() => setPersonalizeModalOpen(false)}
        onSaveAction={handleSavePersonalizedMeal}
      />

      <AssignMealModal
        isOpen={assignModalOpen}
        onCloseAction={() => setAssignModalOpen(false)}
        mealId={meal.id}
        mealName={meal.name}
        onAssignSuccessAction={() => {
          setAssignModalOpen(false);
          // Optional: Show success message or refresh data
        }}
      />
    </>
  );
}
