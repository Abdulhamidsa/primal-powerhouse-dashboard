'use client';

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import { DataService, Meal, MealPlan } from '@/services/dataService';
import { useSideLibrary } from '@/features/sides/hooks/useSideLibrary';
import { type SideItem } from '@/features/sides/types/side.types';

interface AssignMealsModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  clientId: string;
  clientName: string;
  onMealPlanCreatedAction: () => void;
}

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const mealTypes = [
  { value: 'BREAKFAST', label: 'Breakfast', icon: '🌅' },
  { value: 'LUNCH', label: 'Lunch', icon: '☀️' },
  { value: 'DINNER', label: 'Dinner', icon: '🌙' },
  { value: 'SNACK', label: 'Snack', icon: '🍎' },
] as const;

type MealTypeValue = (typeof mealTypes)[number]['value'];

function buildSlotKey(dayOfWeek: number, mealType: string) {
  return `${dayOfWeek}_${mealType}`;
}

function supportsSide(mealType: string): mealType is 'LUNCH' | 'DINNER' {
  return mealType === 'LUNCH' || mealType === 'DINNER';
}

export default function AssignMealsModal({
  isOpen,
  onCloseAction,
  clientId,
  clientName,
  onMealPlanCreatedAction,
}: AssignMealsModalProps) {
  const [loading, setLoading] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<{
    [key: string]: string; // dayOfWeek_mealType -> mealId
  }>({});
  const [selectedSides, setSelectedSides] = useState<Record<string, string>>({});
  const [planName, setPlanName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [existingMealPlan, setExistingMealPlan] = useState<MealPlan | null>(null);
  const { sides, loadSides } = useSideLibrary();

  const fetchMeals = useCallback(async () => {
    try {
      const mealsData = await DataService.getMeals();
      setMeals(mealsData);
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  }, []);

  const fetchExistingMealPlan = useCallback(async () => {
    try {
      console.log('Fetching existing meal plans for client:', clientId);
      const mealPlans = await DataService.getMealPlans(clientId);
      console.log('Meal plans returned:', mealPlans);
      const activePlan = mealPlans.find((plan: MealPlan) => plan.isActive);
      if (activePlan) {
        console.log('Found existing active meal plan:', activePlan);
        setExistingMealPlan(activePlan);

        setPlanName(activePlan.name);
        if (activePlan.startDate) {
          setStartDate(new Date(activePlan.startDate).toISOString().split('T')[0]);
        }
        if (activePlan.endDate) {
          setEndDate(new Date(activePlan.endDate).toISOString().split('T')[0]);
        }
        if (activePlan.notes) {
          setNotes(activePlan.notes);
        }

        if (activePlan.mealAssignments && Array.isArray(activePlan.mealAssignments)) {
          const mealsMap: Record<string, string> = {};
          const sidesMap: Record<string, string> = {};
          activePlan.mealAssignments.forEach((assignment: any) => {
            const key = buildSlotKey(assignment.dayOfWeek, assignment.mealType);
            mealsMap[key] = assignment.mealId;

            if (assignment.side?.id) {
              sidesMap[key] = assignment.side.id;
            }
          });
          setSelectedMeals(mealsMap);
          setSelectedSides(sidesMap);
          console.log('Pre-populated selected meals:', mealsMap);
        }
      }

      if (!activePlan) {
        console.log('No active meal plan found');
        setPlanName(`${clientName}'s Meal Plan`);
        const today = new Date();
        setStartDate(today.toISOString().split('T')[0]);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        setEndDate(nextWeek.toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Error fetching existing meal plans:', error);
      setPlanName(`${clientName}'s Meal Plan`);
      const today = new Date();
      setStartDate(today.toISOString().split('T')[0]);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      setEndDate(nextWeek.toISOString().split('T')[0]);
    }
  }, [clientId, clientName]);

  useEffect(() => {
    if (isOpen) {
      fetchMeals();
      fetchExistingMealPlan();
      loadSides();
    }
  }, [isOpen, fetchMeals, fetchExistingMealPlan, loadSides]);

  const updateSlotSelection = (
    setter: Dispatch<SetStateAction<Record<string, string>>>,
    key: string,
    value: string,
  ) => {
    setter(prev => {
      const next = { ...prev };
      if (!value) {
        delete next[key];
        return next;
      }

      next[key] = value;
      return next;
    });
  };

  const handleMealSelect = (dayOfWeek: number, mealType: string, mealId: string) => {
    const key = buildSlotKey(dayOfWeek, mealType);
    updateSlotSelection(setSelectedMeals, key, mealId);

    if (!mealId) {
      updateSlotSelection(setSelectedSides, key, '');
    }
  };

  const handleSideSelect = (dayOfWeek: number, mealType: MealTypeValue, sideId: string) => {
    const key = buildSlotKey(dayOfWeek, mealType);
    updateSlotSelection(setSelectedSides, key, sideId);
  };

  const getMealForSlot = (dayOfWeek: number, mealType: string) => {
    const key = buildSlotKey(dayOfWeek, mealType);
    const mealId = selectedMeals[key];
    return meals.find(meal => meal.id === mealId);
  };

  const getSideForSlot = (dayOfWeek: number, mealType: MealTypeValue) => {
    const key = buildSlotKey(dayOfWeek, mealType);
    const sideId = selectedSides[key];
    return sides.find(side => side.id === sideId);
  };

  const getAlreadySelectedMealIds = () => {
    return Object.values(selectedMeals).filter(Boolean);
  };

  const getAlreadySelectedSideIds = () => {
    return Object.values(selectedSides).filter(Boolean);
  };

  const getAvailableSidesForSlot = (slotKey: string): SideItem[] => {
    const selectedSideId = selectedSides[slotKey];
    const alreadySelectedSideIds = getAlreadySelectedSideIds();

    return sides.filter(side => {
      if (side.id === selectedSideId) {
        return true;
      }

      if (side.mealAssignmentId) {
        return false;
      }

      return !alreadySelectedSideIds.includes(side.id);
    });
  };

  const handleSubmit = async () => {
    if (!planName || !startDate) {
      alert('Please fill in plan name and start date');
      return;
    }

    if (Object.keys(selectedMeals).length === 0) {
      alert('Please select at least one meal');
      return;
    }

    try {
      setLoading(true);

      // Convert selected meals to assignments - ONLY the meals the user selected
      const mealAssignments = Object.entries(selectedMeals).map(([key, mealId]) => {
        const [dayOfWeek, mealType] = key.split('_');
        return {
          mealId,
          dayOfWeek: parseInt(dayOfWeek),
          mealType: mealType as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
          portion: 1.0,
          sideId: selectedSides[key] || undefined,
        };
      });

      console.log('Submitting meal assignments:', mealAssignments);

      // If there's an existing active meal plan, UPDATE it instead of creating a new one
      if (existingMealPlan) {
        console.log('Updating existing meal plan:', existingMealPlan.id);
        console.log('New meal count:', mealAssignments.length);

        const result = await DataService.updateMealPlan(existingMealPlan.id, {
          clientId,
          name: planName,
          startDate,
          endDate: endDate || undefined,
          notes: notes || undefined,
          mealAssignments,
        });
        console.log('Meal plan updated successfully:', result);
      } else {
        console.log('Creating new meal plan');
        const result = await DataService.createMealPlan({
          clientId,
          name: planName,
          startDate,
          endDate: endDate || undefined,
          notes: notes || undefined,
          mealAssignments,
        });
        console.log('Meal plan created successfully:', result);
      }

      onMealPlanCreatedAction();
      onCloseAction();
      // Reset form
      setSelectedMeals({});
      setSelectedSides({});
      setPlanName('');
      setStartDate('');
      setEndDate('');
      setNotes('');
      setExistingMealPlan(null);
    } catch (error) {
      console.error('Error saving meal plan:', error);
      alert('Failed to save meal plan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {existingMealPlan ? 'Update Meal Plan' : 'Assign Meals'}
              </h2>
              <p className="text-gray-600">
                {existingMealPlan
                  ? `Updating existing meal plan for ${clientName}`
                  : `Create a meal plan for ${clientName}`}
              </p>
              {existingMealPlan && (
                <p className="text-sm text-orange-600 mt-1">
                  ⚠️ This will replace all existing meals and side assignments in the active meal plan with your new
                  selections.
                </p>
              )}
            </div>
            <button onClick={onCloseAction} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-2xl text-gray-500">×</span>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {/* Plan Details */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
                <input
                  type="text"
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter meal plan name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Add any notes about this meal plan"
                />
              </div>
            </div>

            {/* Weekly Meal Grid */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Meal Schedule</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMeals({});
                    setSelectedSides({});
                  }}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Clear All
                </button>
              </div>
              {existingMealPlan && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This meal plan already has {Object.keys(selectedMeals).length} meals and{' '}
                    {Object.keys(selectedSides).length} sides assigned. Click Clear All above to start fresh, or modify
                    individual slots to update the plan.
                  </p>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-left font-medium text-gray-700 border border-gray-200 bg-gray-50">Day</th>
                      {mealTypes.map(mealType => (
                        <th
                          key={mealType.value}
                          className="p-3 text-center font-medium text-gray-700 border border-gray-200 bg-gray-50 min-w-[200px]"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span>{mealType.icon}</span>
                            <span>{mealType.label}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {daysOfWeek.map(day => (
                      <tr key={day.value}>
                        <td className="p-3 font-medium text-gray-900 border border-gray-200 bg-gray-50">{day.label}</td>
                        {mealTypes.map(mealType => {
                          const selectedMeal = getMealForSlot(day.value, mealType.value);
                          const selectedSide = getSideForSlot(day.value, mealType.value);
                          const key = buildSlotKey(day.value, mealType.value);
                          const isPrefilled =
                            existingMealPlan &&
                            existingMealPlan.mealAssignments?.some(
                              a => a.dayOfWeek === day.value && a.mealType === mealType.value,
                            );
                          return (
                            <td
                              key={`${day.value}_${mealType.value}`}
                              className={`p-2 border ${isPrefilled && selectedMeals[key] ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                            >
                              <select
                                value={selectedMeals[key] || ''}
                                onChange={e => handleMealSelect(day.value, mealType.value, e.target.value)}
                                className={`w-full px-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  isPrefilled && selectedMeals[key] ? 'border-blue-400 bg-blue-100' : 'border-gray-300'
                                }`}
                              >
                                <option value="">Select meal...</option>
                                {meals
                                  .filter(meal => meal.type === mealType.value)
                                  .filter(meal => {
                                    // Hide meals that are already selected elsewhere UNLESS this slot currently has that meal
                                    const selectedMealId = selectedMeals[key];
                                    const alreadySelected = getAlreadySelectedMealIds();
                                    return !alreadySelected.includes(meal.id) || meal.id === selectedMealId;
                                  })
                                  .map(meal => (
                                    <option key={meal.id} value={meal.id}>
                                      {meal.name} ({meal.calories} cal)
                                    </option>
                                  ))}
                              </select>
                              {selectedMeal && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                                  <div className="text-xs text-gray-600">
                                    <div>🔥 {selectedMeal.calories} cal</div>
                                    <div>🥩 {selectedMeal.protein}g protein</div>
                                    <div>🍞 {selectedMeal.carbs}g carbs</div>
                                    <div>🥑 {selectedMeal.fat}g fat</div>
                                  </div>
                                </div>
                              )}
                              {selectedMeal && supportsSide(mealType.value) && (
                                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                                      Optional side
                                    </span>
                                  </div>
                                  <select
                                    value={selectedSides[key] || ''}
                                    onChange={e => handleSideSelect(day.value, mealType.value, e.target.value)}
                                    className="mt-2 w-full rounded-lg border border-emerald-300 bg-white px-2 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  >
                                    <option value="">No side</option>
                                    {getAvailableSidesForSlot(key).map(side => (
                                      <option key={side.id} value={side.id}>
                                        {side.name} ({side.calories} cal)
                                      </option>
                                    ))}
                                  </select>

                                  {selectedSide && (
                                    <div className="mt-2 rounded-lg bg-white p-2 text-xs text-gray-600">
                                      <div className="font-semibold text-gray-800">{selectedSide.name}</div>
                                      <div className="mt-1">
                                        {selectedSide.type === 'SALAD' ? 'Salad' : 'Soup'} side
                                      </div>
                                      <div>{selectedSide.calories} cal kept separate from main meal totals</div>
                                      {selectedSide.foodOrigin && <div>{selectedSide.foodOrigin}</div>}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Meal Plan Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Meals:</span>
                  <span className="ml-2 font-medium">{Object.keys(selectedMeals).length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Sides:</span>
                  <span className="ml-2 font-medium">{Object.keys(selectedSides).length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Avg Daily Calories:</span>
                  <span className="ml-2 font-medium">
                    {Object.values(selectedMeals).length > 0
                      ? Math.round(
                          Object.values(selectedMeals).reduce((total, mealId) => {
                            const meal = meals.find(m => m.id === mealId);
                            return total + (meal?.calories || 0);
                          }, 0) / 7,
                        )
                      : 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Avg Daily Side Calories:</span>
                  <span className="ml-2 font-medium">
                    {Object.values(selectedSides).length > 0
                      ? Math.round(
                          Object.values(selectedSides).reduce((total, sideId) => {
                            const side = sides.find(item => item.id === sideId);
                            return total + (side?.calories || 0);
                          }, 0) / 7,
                        )
                      : 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-2 font-medium">
                    {startDate && endDate
                      ? `${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                      : 'Ongoing'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Meal Types:</span>
                  <span className="ml-2 font-medium">
                    {new Set(Object.entries(selectedMeals).map(([key]) => key.split('_')[1])).size} types
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onCloseAction}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !planName || !startDate || Object.keys(selectedMeals).length === 0}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {existingMealPlan ? 'Update Meal Plan' : 'Create Meal Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
