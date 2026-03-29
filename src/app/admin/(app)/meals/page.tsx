'use client';

import { useState, useMemo, useCallback } from 'react';
import AddMealModal from '@/components/AddMealModal';
import MealBuilderModal from '@/components/MealBuilderModal';
import EditMealModal from '@/components/EditMealModal';
import NewMealDetailModal from '@/components/NewMealDetailModal';
import { DataService } from '@/services/dataService';
import { Meal as MealType } from '@/types/meal';
import { MealsHeader } from './MealsHeader';
import { MealFilters } from './MealsFilter';
import { MealFilterType, MealListItem, mealTypes } from '@/lib/meal-planner/types';
import { MealsGrid } from './MealsGrid';
import { DeleteMealModal } from './DeleteMealModal';
import { useMeals } from '@/hooks/useMeals';
import { convertToMealType } from '@/lib/meal-planner/adaptoers/mealToDetailMeal';
// import MealGeneratorPanel from '@/features/meals/components/MealGeneratorPanel';

export default function MealsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [mealToEdit, setMealToEdit] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedType, setSelectedType] = useState<MealFilterType>('ALL');
  const { meals, isLoading: loading, refreshMeals } = useMeals();
  console.log(
    'heeyy',
    selectedType,
    meals.filter(meal => meal.type === 'LUNCH'),
  );
  // meals lenght by type

  const filteredMeals = useMemo(() => {
    return selectedType === 'ALL' ? meals : meals.filter(meal => meal.type === selectedType);
  }, [meals, selectedType]);

  const mealCounts = useMemo(
    () => ({
      ALL: meals.length,
      BREAKFAST: meals.filter(meal => meal.type === 'BREAKFAST').length,
      LUNCH: meals.filter(meal => meal.type === 'LUNCH').length,
      DINNER: meals.filter(meal => meal.type === 'DINNER').length,
      SNACK: meals.filter(meal => meal.type === 'SNACK').length,
    }),
    [meals],
  );

  const handleViewMeal = useCallback((meal: MealListItem) => {
    const convertedMeal = convertToMealType(meal);
    setSelectedMeal(convertedMeal);
    setShowDetailModal(true);
  }, []);

  const handleEditMeal = useCallback((mealId: string) => {
    setMealToEdit(mealId);
    setShowEditModal(true);
  }, []);

  const handleDeleteMeal = useCallback((mealId: string) => {
    setMealToDelete(mealId);
  }, []);
  const confirmDelete = async () => {
    if (!mealToDelete) return;

    const mealId = mealToDelete;
    setDeleting(true);

    try {
      await DataService.deleteMeal(mealId);
      setMealToDelete(null);
      await refreshMeals();
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete meal');
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <MealsHeader onCreateManual={() => setShowAddModal(true)} onOpenBuilder={() => setShowBuilderModal(true)} />
        {/* Filter Tabs */}
        <MealFilters
          mealCounts={mealCounts}
          mealTypes={[...mealTypes]}
          selectedType={selectedType}
          onSelectType={setSelectedType}
        />{' '}
        {/* Generator Panel */}
        {/* <div className="my-6">
          <MealGeneratorPanel onTemplateSaved={refreshMeals} />
        </div> */}
        {/* Stats Overview */}
        {/* <StatsOverview meals={meals} filteredMealsCount={filteredMeals.length} loading={loading} /> */}
        {/* Meals Grid */}
        <MealsGrid
          meals={filteredMeals}
          loading={loading}
          selectedType={selectedType}
          onViewMeal={handleViewMeal}
          onEditMeal={handleEditMeal}
          onDeleteMeal={handleDeleteMeal}
        />
      </div>

      {/* Add Meal Modal */}
      <AddMealModal
        isOpen={showAddModal}
        onCloseAction={() => setShowAddModal(false)}
        onMealAddedAction={refreshMeals}
      />

      <MealBuilderModal
        isOpen={showBuilderModal}
        onCloseAction={() => setShowBuilderModal(false)}
        onMealCreatedAction={refreshMeals}
      />

      <EditMealModal
        isOpen={showEditModal}
        mealId={mealToEdit}
        onCloseAction={() => {
          setShowEditModal(false);
          setMealToEdit(null);
        }}
        onMealUpdatedAction={refreshMeals}
      />

      {/* Meal Detail Modal */}
      <NewMealDetailModal
        meal={selectedMeal}
        isOpen={showDetailModal}
        onCloseAction={() => setShowDetailModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteMealModal
        isOpen={!!mealToDelete}
        deleting={deleting}
        onCancel={() => setMealToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
