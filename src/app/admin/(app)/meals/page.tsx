'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChefHatIcon as ChefHat, PlusIcon as Plus, ArrowsClockwiseIcon as Sparkles } from '@phosphor-icons/react';
import AddMealModal from '@/components/AddMealModal';
import MealBuilderModal from '@/components/MealBuilderModal';
import EditMealModal from '@/components/EditMealModal';
import NewMealDetailModal from '@/components/NewMealDetailModal';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader, AdminPanel, AdminPanelHeader } from '@/features/admin-shell/components/AdminPage';
import { useSideLibrary } from '@/features/sides/hooks/useSideLibrary';
import { useMeals } from '@/hooks/useMeals';
import { convertToMealType } from '@/lib/meal-planner/adaptoers/mealToDetailMeal';
import { MealFilterType, MealListItem, mealTypes } from '@/lib/meal-planner/types';
import { DataService } from '@/services/dataService';
import { Meal as MealType } from '@/types/meal';
import { DeleteMealModal } from './DeleteMealModal';
import { MealFilters, MealSmartFilter, MealSortOption } from './MealsFilter';
import { MealsGrid } from './MealsGrid';
import { StatsOverview } from './StatsOverview';
// import MealGeneratorPanel from '@/features/meals/components/MealGeneratorPanel';

const getSearchableIngredientText = (meal: MealListItem) =>
  (meal.ingredients || [])
    .map(ingredient => (typeof ingredient === 'string' ? ingredient : ingredient.name || ingredient.foodId || ''))
    .join(' ');

const hasImage = (meal: MealListItem) => Boolean(meal.imageUrl && meal.imageUrl.trim() !== '');

const getTotalTime = (meal: MealListItem) => (Number(meal.prepTime) || 0) + (Number(meal.cookTime) || 0);

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<MealSortOption>('newest');
  const [smartFilters, setSmartFilters] = useState<MealSmartFilter[]>([]);
  const { meals, isLoading: loading, refreshMeals } = useMeals();
  const { sides = [], isLoading: sidesLoading, loadSides } = useSideLibrary();

  useEffect(() => {
    loadSides();
  }, [loadSides]);

  const sideMeals = useMemo(
    () =>
      sides.map(side => ({
        ...side,
        type: 'SIDES' as const,
        prepTime: 0,
        cookTime: 10,
        servings: 1,
        tags: ['side', side.type === 'SALAD' ? 'salad' : 'soup'],
        createdAt: side.createdAt || new Date().toISOString(),
        updatedAt: side.updatedAt || new Date().toISOString(),
      })) as unknown as MealListItem[],
    [sides],
  );

  const allLibraryItems = useMemo(() => [...meals, ...sideMeals], [meals, sideMeals]);

  const filteredMeals = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const typedMeals =
      selectedType === 'ALL'
        ? allLibraryItems
        : selectedType === 'SIDES'
          ? sideMeals
          : meals.filter(meal => meal.type === selectedType);

    const searchedMeals = normalizedSearch
      ? typedMeals.filter(meal => {
          const haystack = [meal.name, meal.type, ...(meal.tags || []), getSearchableIngredientText(meal)]
            .join(' ')
            .toLowerCase();
          return haystack.includes(normalizedSearch);
        })
      : typedMeals;

    const smartFilteredMeals = searchedMeals.filter(meal => {
      if (smartFilters.includes('highProtein') && (Number(meal.protein) || 0) < 30) return false;
      if (smartFilters.includes('lowCalorie') && (Number(meal.calories) || 0) > 500) return false;
      if (smartFilters.includes('quick') && getTotalTime(meal) > 25) return false;
      if (smartFilters.includes('hasImage') && !hasImage(meal)) return false;
      if (smartFilters.includes('missingImage') && hasImage(meal)) return false;
      return true;
    });

    return [...smartFilteredMeals].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'caloriesAsc':
          return (Number(a.calories) || 0) - (Number(b.calories) || 0);
        case 'caloriesDesc':
          return (Number(b.calories) || 0) - (Number(a.calories) || 0);
        case 'proteinDesc':
          return (Number(b.protein) || 0) - (Number(a.protein) || 0);
        case 'prepTimeAsc':
          return getTotalTime(a) - getTotalTime(b);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [allLibraryItems, meals, searchQuery, selectedType, sideMeals, smartFilters, sortBy]);

  const mealCounts = useMemo(
    () => ({
      ALL: meals.length + sideMeals.length,
      BREAKFAST: meals.filter(meal => meal.type === 'BREAKFAST').length,
      LUNCH: meals.filter(meal => meal.type === 'LUNCH').length,
      DINNER: meals.filter(meal => meal.type === 'DINNER').length,
      SNACK: meals.filter(meal => meal.type === 'SNACK').length,
      SIDES: sideMeals.length,
    }),
    [meals, sideMeals],
  );

  const hasActiveFilters = selectedType !== 'ALL' || searchQuery.trim() !== '' || smartFilters.length > 0;

  const toggleSmartFilter = useCallback((filter: MealSmartFilter) => {
    setSmartFilters(current =>
      current.includes(filter) ? current.filter(item => item !== filter) : [...current, filter],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedType('ALL');
    setSearchQuery('');
    setSmartFilters([]);
    setSortBy('newest');
  }, []);

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
    <AdminPage className="max-w-none">
      <AdminPageHeader
        eyebrow="Nutrition library"
        title="Meal Library"
        description="Create, organize, and refine reusable meals and sides for client plans. Search the full library, filter by practical coaching needs, then open cards to review or edit."
        actions={
          <>
            <Button
              onClick={() => setShowAddModal(true)}
              className="gap-2 rounded-xl bg-[var(--color-accent)] text-[var(--color-text-on-accent)] hover:opacity-90"
            >
              <Plus size={16} />
              Create manually
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowBuilderModal(true)}
              className="gap-2 rounded-xl border-white/10 bg-white/[0.06] text-foreground hover:bg-white/[0.1]"
            >
              <ChefHat size={16} />
              Add meal template
            </Button>
          </>
        }
      />

      <StatsOverview
        meals={allLibraryItems}
        sidesCount={sideMeals.length}
        filteredMealsCount={filteredMeals.length}
        loading={loading || sidesLoading}
      />

      <AdminPanel className="overflow-hidden">
        <AdminPanelHeader
          icon={<Sparkles size={18} />}
          title="Library workbench"
          description="Use quick controls to find meals by type, name, ingredients, tags, macro profile, image status, or prep speed."
          meta={
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-muted-foreground">
              {filteredMeals.length} result{filteredMeals.length === 1 ? '' : 's'}
            </span>
          }
        />

        <div className="space-y-5 p-5">
          <MealFilters
            activeSmartFilters={smartFilters}
            hasActiveFilters={hasActiveFilters}
            mealCounts={mealCounts}
            mealTypes={[...mealTypes]}
            searchQuery={searchQuery}
            selectedType={selectedType}
            sortBy={sortBy}
            onClearFilters={clearFilters}
            onSearchChange={setSearchQuery}
            onSelectType={setSelectedType}
            onSortChange={setSortBy}
            onToggleSmartFilter={toggleSmartFilter}
          />

          {/* Generator Panel */}
          {/* <div className="my-6">
            <MealGeneratorPanel onTemplateSaved={refreshMeals} />
          </div> */}

          <MealsGrid
            meals={filteredMeals}
            loading={loading || sidesLoading}
            hasActiveFilters={hasActiveFilters}
            selectedType={selectedType}
            onViewMeal={handleViewMeal}
            onEditMeal={handleEditMeal}
            onDeleteMeal={handleDeleteMeal}
          />
        </div>
      </AdminPanel>

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

      <NewMealDetailModal
        meal={selectedMeal}
        isOpen={showDetailModal}
        onCloseAction={() => setShowDetailModal(false)}
      />

      <DeleteMealModal
        isOpen={!!mealToDelete}
        deleting={deleting}
        onCancel={() => setMealToDelete(null)}
        onConfirm={confirmDelete}
      />
    </AdminPage>
  );
}
