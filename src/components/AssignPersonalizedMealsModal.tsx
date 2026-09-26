'use client';

import React, { useState, useEffect } from 'react';
import { Meal, Client } from '@/types/meal';
import { XIcon as X, MagnifyingGlassIcon as Search, CalendarIcon as Calendar, PencilSimpleIcon as Edit, UserIcon as User, CheckIcon as Check } from '@phosphor-icons/react';
import AdvancedMealPersonalization from './AdvancedMealPersonalization';
import { clientApi } from '@/lib/client-api';

interface AssignPersonalizedMealsModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  clientId?: string;
  onAssignAction?: (mealId: string, clientId: string, isPersonalized: boolean) => void;
}

export default function AssignPersonalizedMealsModal({
  isOpen,
  onCloseAction,
  clientId,
  onAssignAction,
}: AssignPersonalizedMealsModalProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clientId || null);
  const [loading, setLoading] = useState(true);
  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false);
  const [mealToPersonalize, setMealToPersonalize] = useState<Meal | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from your API
    const fetchData = async () => {
      setLoading(true);
      try {
        // Mock data for demonstration
        const mockMeals: Meal[] = [
          {
            id: '1',
            name: 'Grilled Chicken Bowl',
            type: 'lunch',
            description: 'A healthy lunch bowl with grilled chicken.',
            calories: 450,
            protein: 35,
            carbs: 40,
            fat: 12,
            fiber: 6,
            sodium: 400,
            sugar: 3,
            cholesterol: 70,
            ingredients: [
              { id: '1', name: 'Chicken Breast', amount: 150, unit: 'g' },
              { id: '2', name: 'Brown Rice', amount: 100, unit: 'g' },
              { id: '3', name: 'Broccoli', amount: 80, unit: 'g' },
              { id: '4', name: 'Olive Oil', amount: 10, unit: 'ml' },
            ],
            instructions: [
              { id: '1', step: 1, instruction: 'Season the chicken breast with salt and pepper.' },
              { id: '2', step: 2, instruction: 'Grill the chicken for about 6-8 minutes on each side.' },
              { id: '3', step: 3, instruction: 'Cook the brown rice according to package instructions.' },
              { id: '4', step: 4, instruction: 'Steam the broccoli until tender.' },
              { id: '5', step: 5, instruction: 'Assemble the bowl and drizzle with olive oil.' },
            ],
            prepTime: 10,
            cookTime: 25,
            servings: 1,
            tags: ['high-protein', 'meal-prep', 'healthy'],
            images: ['https://picsum.photos/id/102/800/600'],
            difficulty: 'easy',
            equipment: ['Grill', 'Pot'],
            tips: ['You can meal prep this by making multiple servings at once.'],
            allergens: ['none'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            name: 'Berry Protein Smoothie',
            type: 'breakfast',
            description: 'A quick and nutritious protein smoothie with mixed berries.',
            calories: 320,
            protein: 25,
            carbs: 30,
            fat: 8,
            fiber: 5,
            sodium: 120,
            sugar: 15,
            cholesterol: 5,
            ingredients: [
              { id: '1', name: 'Protein Powder', amount: 30, unit: 'g' },
              { id: '2', name: 'Mixed Berries', amount: 100, unit: 'g' },
              { id: '3', name: 'Greek Yogurt', amount: 100, unit: 'g' },
              { id: '4', name: 'Almond Milk', amount: 200, unit: 'ml' },
            ],
            instructions: [
              { id: '1', step: 1, instruction: 'Add all ingredients to a blender.' },
              { id: '2', step: 2, instruction: 'Blend until smooth.' },
            ],
            prepTime: 5,
            cookTime: 0,
            servings: 1,
            tags: ['high-protein', 'quick', 'breakfast'],
            images: ['https://picsum.photos/id/109/800/600'],
            difficulty: 'easy',
            equipment: ['Blender'],
            tips: ['You can add ice for a thicker consistency.'],
            allergens: ['dairy'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        const mockClients: Client[] = [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            activityLevel: 'moderately_active',
            goals: ['weight loss'],
            dietaryRestrictions: [],
            allergies: [],
            preferences: [],
            mealHistory: [],
            joinDate: new Date(),
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            activityLevel: 'very_active',
            goals: ['muscle gain'],
            dietaryRestrictions: [],
            allergies: [],
            preferences: [],
            mealHistory: [],
            joinDate: new Date(),
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        setMeals(mockMeals);
        setClients(mockClients);

        // Preselect client if provided
        if (clientId) {
          setSelectedClientId(clientId);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, clientId]);

  const filteredMeals = meals.filter(
    meal =>
      meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meal.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const selectedMeal = meals.find(meal => meal.id === selectedMealId) || null;
  const selectedClient = clients.find(client => client.id === selectedClientId) || null;

  const handleAssign = () => {
    if (selectedMealId && selectedClientId) {
      if (onAssignAction) {
        onAssignAction(selectedMealId, selectedClientId, false);
      }

      setSuccessMessage(`Assigned ${selectedMeal?.name} to ${selectedClient?.name} successfully!`);

      // Show an alert to make the feedback clearer
      alert(
        `"${selectedMeal?.name}" has been added to your meal plan. Click "Create Meal Plan" to save all assignments.`,
      );

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }
  };

  const handlePersonalize = (meal: Meal) => {
    setMealToPersonalize(meal);
    setShowPersonalizationModal(true);
  };

  const handleSavePersonalizedMeal = async (personalizedMeal: Meal, clientId?: string) => {
    try {
      if (clientId) {
        setLoading(true);

        const normalizeIngredient = (ingredient: unknown) => {
          if (typeof ingredient === 'string') {
            // Keep legacy plain-text ingredients compatible.
            const trimmed = ingredient.trim();
            return trimmed && trimmed !== '[object Object]' ? trimmed : '';
          }

          if (!ingredient || typeof ingredient !== 'object') {
            return '';
          }

          const value = ingredient as Record<string, unknown>;
          const nestedIngredient =
            value.ingredient && typeof value.ingredient === 'object' && !Array.isArray(value.ingredient)
              ? (value.ingredient as Record<string, unknown>)
              : null;

          const name =
            (typeof value.name === 'string' ? value.name : '') ||
            (typeof nestedIngredient?.name === 'string' ? nestedIngredient.name : '');
          const amount = typeof value.amount === 'number' ? value.amount : null;
          const unit = typeof value.unit === 'string' ? value.unit : null;

          // Preserve structured ingredients (foodId, nutritionPer100g, etc.) when present.
          if ('foodId' in value || 'nutritionPer100g' in value || 'grams' in value) {
            return value;
          }

          if (!name) {
            return '';
          }

          if (amount !== null && unit) {
            return `${amount} ${unit} ${name}`;
          }

          return name;
        };

        const normalizeInstruction = (instruction: unknown): string => {
          if (typeof instruction === 'string') {
            const trimmed = instruction.trim();
            return trimmed && trimmed !== '[object Object]' ? trimmed : '';
          }

          if (!instruction || typeof instruction !== 'object') {
            return '';
          }

          const value = instruction as Record<string, unknown>;
          const direct =
            (typeof value.instruction === 'string' ? value.instruction : '') ||
            (typeof value.stepText === 'string' ? value.stepText : '') ||
            (typeof value.text === 'string' ? value.text : '') ||
            (typeof value.description === 'string' ? value.description : '');

          const trimmed = direct.trim();
          return trimmed && trimmed !== '[object Object]' ? trimmed : '';
        };

        // Convert Meal to PersonalizedMealInput by adding required fields
        // and handling the specific format requirements
        const mealInput = {
          name: personalizedMeal.name,
          description: personalizedMeal.description || '',
          ingredients: Array.isArray(personalizedMeal.ingredients)
            ? personalizedMeal.ingredients.map(normalizeIngredient).filter(Boolean)
            : [],
          instructions: Array.isArray(personalizedMeal.instructions)
            ? personalizedMeal.instructions.map(normalizeInstruction).filter(Boolean)
            : [],
          calories: personalizedMeal.calories,
          protein: personalizedMeal.protein,
          carbs: personalizedMeal.carbs,
          fat: personalizedMeal.fat,
          fiber: personalizedMeal.fiber,
          prepTime: personalizedMeal.prepTime,
          cookTime: personalizedMeal.cookTime,
          servings: personalizedMeal.servings,
          imageUrl: personalizedMeal.images && personalizedMeal.images.length > 0 ? personalizedMeal.images[0] : '',
          tags: personalizedMeal.tags,
          type: personalizedMeal.type as any,
          coachId: '1', // Using a placeholder - in a real app, get this from context/auth
        };

        // Save the personalized meal using client-side safe API
        await clientApi.createPersonalizedMeal(
          mealInput,
          clientId,
          personalizedMeal.id, // Pass the original meal ID
        );

        setSuccessMessage(`Personalized meal created and assigned to client successfully!`);

        // Show an alert to make the feedback clearer
        alert(
          `Personalized meal "${personalizedMeal.name}" has been added to your meal plan. Click "Create Meal Plan" to save all assignments.`,
        );

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
          setShowPersonalizationModal(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving personalized meal:', error);
      alert(`Error saving personalized meal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-start overflow-y-auto">
      <div
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl m-4 w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex justify-between items-center p-4 border-b"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2 className="text-xl font-bold">Assign Meals to Client</h2>
          <button
            onClick={onCloseAction}
            className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Success Message */}
          {successMessage && (
            <div
              className="mb-4 p-3 rounded flex items-center gap-2"
              style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}
            >
              <Check size={18} />
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Left Panel - Meals */}
            <div className="md:col-span-3 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Choose a Meal</h3>

                {/* Search */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search meals..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-10 border rounded"
                    style={{
                      background: 'var(--color-bg-alt)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                </div>

                {/* Meals List */}
                {loading ? (
                  <div className="p-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
                    Loading meals...
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {filteredMeals.length === 0 ? (
                      <div className="p-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
                        No meals found matching your search.
                      </div>
                    ) : (
                      filteredMeals.map(meal => (
                        <div
                          key={meal.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                            selectedMealId === meal.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                          }`}
                          style={{
                            background:
                              selectedMealId === meal.id ? 'var(--color-accent-translucent)' : 'var(--color-bg-alt)',
                            borderColor: selectedMealId === meal.id ? 'var(--color-accent)' : 'var(--color-border)',
                          }}
                          onClick={() => setSelectedMealId(meal.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{meal.name}</h4>
                              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                {meal.description?.substring(0, 60)}
                                {meal.description?.length > 60 ? '...' : ''}
                              </p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                  {meal.calories} kcal
                                </span>
                                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                  P: {meal.protein}g
                                </span>
                                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                  C: {meal.carbs}g
                                </span>
                                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                  F: {meal.fat}g
                                </span>
                              </div>
                            </div>

                            <div className="ml-3">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handlePersonalize(meal);
                                }}
                                className="p-2 rounded-full hover:bg-opacity-10 transition-colors"
                                style={{ color: 'var(--color-accent)' }}
                                title="Personalize this meal"
                              >
                                <Edit size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Client & Assignment */}
            <div className="md:col-span-2 space-y-6">
              {/* Client Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Client</h3>

                {clientId ? (
                  <div
                    className="p-3 rounded-lg border"
                    style={{
                      background: 'var(--color-bg-alt)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--color-accent-translucent)' }}
                      >
                        <User size={20} style={{ color: 'var(--color-accent)' }} />
                      </div>
                      <div>
                        <div className="font-medium">{selectedClient?.name || 'Loading client...'}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {selectedClient?.email || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {loading ? (
                      <div className="p-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
                        Loading clients...
                      </div>
                    ) : (
                      clients.map(client => (
                        <div
                          key={client.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                            selectedClientId === client.id
                              ? 'border-blue-500'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                          style={{
                            background:
                              selectedClientId === client.id
                                ? 'var(--color-accent-translucent)'
                                : 'var(--color-bg-alt)',
                            borderColor: selectedClientId === client.id ? 'var(--color-accent)' : 'var(--color-border)',
                          }}
                          onClick={() => setSelectedClientId(client.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ background: 'var(--color-bg)' }}
                            >
                              <User size={20} style={{ color: 'var(--color-text-muted)' }} />
                            </div>
                            <div>
                              <div className="font-medium">{client.name}</div>
                              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                {client.email}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Assignment Options */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Assignment Options</h3>

                <div>
                  <button
                    onClick={() => {
                      if (selectedMealId && selectedClient) {
                        handlePersonalize(selectedMeal!);
                      }
                    }}
                    disabled={!selectedMealId || !selectedClientId}
                    className={`w-full mb-3 p-3 rounded-lg flex items-center justify-center gap-2 ${
                      !selectedMealId || !selectedClientId ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{
                      background: 'var(--color-accent-translucent)',
                      color: 'var(--color-accent)',
                      borderColor: 'var(--color-accent)',
                      border: '1px solid',
                    }}
                  >
                    <Edit size={18} />
                    Personalize Before Assigning
                  </button>

                  <button
                    onClick={handleAssign}
                    disabled={!selectedMealId || !selectedClientId}
                    className={`w-full p-3 rounded-lg flex items-center justify-center gap-2 ${
                      !selectedMealId || !selectedClientId ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{
                      background: 'var(--color-accent)',
                      color: 'var(--color-text-on-accent)',
                    }}
                  >
                    <Calendar size={18} />
                    Assign Without Personalization
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personalization Modal */}
      {showPersonalizationModal && mealToPersonalize && (
        <AdvancedMealPersonalization
          meal={mealToPersonalize}
          clientId={selectedClientId || undefined}
          isOpen={showPersonalizationModal}
          onCloseAction={() => setShowPersonalizationModal(false)}
          onSaveAction={handleSavePersonalizedMeal}
        />
      )}
    </div>
  );
}
