'use client';

import { Meal } from '@/types/meal';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Clock, Users, Utensils, Sunrise, Sun, Moon, Apple } from 'lucide-react';
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
        <DialogContent
          className="max-w-4xl sm:max-w-[700px] p-0"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          {/* Header with image */}
          <div className="relative">
            {meal.images && meal.images.length > 0 && meal.images[0] && meal.images[0].trim() !== '' ? (
              <div className="h-64 overflow-hidden">
                <Image
                  src={meal.images[0]}
                  alt={meal.name}
                  className="w-full h-full object-cover"
                  width={500}
                  height={300}
                  onError={(e: any) => {
                    // Fallback image if the meal image fails to load
                    const imgElement = e.target as HTMLImageElement;
                    imgElement.src = 'https://picsum.photos/800/600?food';
                  }}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center" style={{ background: 'var(--color-bg-alt)' }}>
                <div style={{ color: 'var(--color-text-muted)' }}>{getMealTypeIconLarge(meal.type)}</div>
              </div>
            )}

            {/* Meal type badge */}
            <div
              className="absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2"
              style={{
                background: 'var(--color-accent-translucent)',
                color: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
              }}
            >
              {getMealTypeIcon(meal.type)} {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
            </div>
          </div>

          <div className="p-6">
            <div>
              <DialogTitle className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                {meal.name}
              </DialogTitle>
              <div style={{ color: 'var(--color-text-muted)' }}>Meal details</div>
              <div className="flex items-center gap-4 text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Prep: {meal.prepTime} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Cook: {meal.cookTime} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>
                    {meal.servings} serving{meal.servings !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Nutrition Grid */}
            <div
              className="grid grid-cols-2 md:grid-cols-5 gap-4 my-6 p-3 rounded-lg"
              style={{ background: 'var(--color-bg-alt)' }}
            >
              <div className="rounded-xl p-4 text-center" style={{ background: 'var(--color-accent-translucent)' }}>
                <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {meal.calories}
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                  Calories
                </div>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: 'var(--color-accent-translucent)' }}>
                <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {meal.protein}g
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                  Protein
                </div>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: 'var(--color-accent-translucent)' }}>
                <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {meal.carbs}g
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                  Carbs
                </div>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: 'var(--color-accent-translucent)' }}>
                <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {meal.fat}g
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                  Fat
                </div>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: 'var(--color-accent-translucent)' }}>
                <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {meal.fiber}g
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                  Fiber
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ingredients */}
              <div>
                <h2
                  className="text-xl font-semibold mb-4 flex items-center gap-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  <Utensils className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                  Ingredients
                </h2>
                <ul className="space-y-2">
                  {meal.ingredients.map((ingredient, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg"
                      style={{ background: 'var(--color-bg-alt)' }}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5"
                        style={{
                          background: 'var(--color-accent-translucent)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        {typeof ingredient === 'string'
                          ? ingredient
                          : `${ingredient.amount} ${ingredient.unit} ${ingredient.name}${ingredient.notes ? ` (${ingredient.notes})` : ''}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h2
                  className="text-xl font-semibold mb-4 flex items-center gap-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  <Clock className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                  Instructions
                </h2>
                <ol className="space-y-3">
                  {meal.instructions.map((instruction, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg"
                      style={{ background: 'var(--color-bg-alt)' }}
                    >
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                        style={{
                          background: 'var(--color-accent)',
                          color: 'var(--color-text-on-accent)',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        {typeof instruction === 'string' ? instruction : instruction.instruction}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Tags */}
            {meal.tags.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {meal.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm rounded-full border"
                      style={{
                        background: 'var(--color-accent-translucent)',
                        color: 'var(--color-accent)',
                        borderColor: 'var(--color-accent)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                ID: {meal.id.slice(0, 8)}...
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPersonalizeModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{
                    background: 'var(--color-accent-translucent)',
                    color: 'var(--color-accent)',
                    borderColor: 'var(--color-accent)',
                    border: '1px solid',
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M2 12h20M2 12a10 10 0 0 1 20 0M2 12a10 10 0 0 0 20 0"></path>
                  </svg>
                  Personalize
                </button>

                <button
                  onClick={() => setAssignModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Assign
                </button>

                {onEditAction && (
                  <button
                    onClick={() => onEditAction(meal)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                    style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    Edit
                  </button>
                )}

                {onDeleteAction && (
                  <button
                    onClick={() => onDeleteAction(meal.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                    style={{
                      background: 'var(--color-accent)',
                      color: 'var(--color-text-on-accent)',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                    Delete
                  </button>
                )}
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
