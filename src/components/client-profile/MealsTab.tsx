import { CalendarDays, Utensils, FileText, PlusCircle, Trash2, Edit } from 'lucide-react';
import { cx, iosPanel, iosPanelStyle } from '../../lib/ui';
import { MealAssignment } from '@/lib/client-page/types';
import { JSX, useState } from 'react';
import Image from 'next/image';
import EditMealModal from '../EditMealModal';

export function MealsTab({
  assignments,
  onAssign,
  onRemove,
  onMealUpdated,
}: {
  assignments: MealAssignment[];
  onAssign: () => void;
  onRemove?: (assignmentId: string) => Promise<void>;
  onMealUpdated?: () => Promise<void>;
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [mealToEdit, setMealToEdit] = useState<string | null>(null);
  // Changed to use 'ALL' as default to always show all meals initially
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'LUNCH' | 'DINNER' | 'BREAKFAST' | 'SNACK'>('ALL');

  // Define custom filter options for better UX
  const filterOptions = [
    { key: 'ALL' as const, label: 'All Meals' },
    { key: 'LUNCH' as const, label: 'Lunch' },
    { key: 'DINNER' as const, label: 'Dinner' },
    { key: 'BREAKFAST' as const, label: 'Breakfast' },
    { key: 'SNACK' as const, label: 'Snack' },
  ];

  // Filter assignments based on selected meal type
  const filteredAssignments = (() => {
    if (selectedFilter === 'ALL') return assignments;
    if (selectedFilter === 'LUNCH') return assignments.filter(a => a.meal?.type?.toUpperCase() === 'LUNCH');
    if (selectedFilter === 'DINNER') return assignments.filter(a => a.meal?.type?.toUpperCase() === 'DINNER');
    if (selectedFilter === 'BREAKFAST') return assignments.filter(a => a.meal?.type?.toUpperCase() === 'BREAKFAST');
    if (selectedFilter === 'SNACK') return assignments.filter(a => a.meal?.type?.toUpperCase() === 'SNACK');
    return assignments;
  })();

  // Calculate counts for each filter
  const filterCounts = {
    ALL: assignments.length,
    LUNCH: assignments.filter(a => a.meal?.type?.toUpperCase() === 'LUNCH').length,
    DINNER: assignments.filter(a => a.meal?.type?.toUpperCase() === 'DINNER').length,
    BREAKFAST: assignments.filter(a => a.meal?.type?.toUpperCase() === 'BREAKFAST').length,
    SNACK: assignments.filter(a => a.meal?.type?.toUpperCase() === 'SNACK').length,
  };

  const handleEditMeal = (mealId: string) => {
    setMealToEdit(mealId);
    setShowEditModal(true);
  };

  const handleMealUpdated = async () => {
    setShowEditModal(false);
    setMealToEdit(null);
    if (onMealUpdated) {
      await onMealUpdated();
    }
  };

  return (
    <section className={cx(iosPanel, 'p-5 sm:p-6')} style={iosPanelStyle}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h3 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Assigned Meals
        </h3>

        <button
          onClick={onAssign}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.99]"
          style={{ background: 'var(--color-accent)', color: 'var(--color-text-black)' }}
        >
          <PlusCircle size={18} />
          Assign Meals
        </button>
      </div>

      {/* Filter Buttons - Always Visible */}
      <div className="mb-6">
        <div
          className="rounded-xl p-4 border"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Filter by Meal Type
          </p>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(option => (
              <button
                key={option.key}
                onClick={() => setSelectedFilter(option.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                  selectedFilter === option.key
                    ? 'border-accent shadow-sm '
                    : 'border-transparent  hover:border-opacity-30 hover:border-accent'
                }`}
                style={{
                  background: selectedFilter === option.key ? 'var(--color-accent)' : 'rgba(255,255,255,0.04)',
                  color: selectedFilter === option.key ? 'var(--color-text-black)' : 'var(--color-text-muted)',
                  borderColor: selectedFilter === option.key ? 'var(--color-accent)' : 'var(--color-border)',
                }}
              >
                {option.label} ({filterCounts[option.key]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {assignments.length > 0 ? (
        <>
          {filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredAssignments.map(a => {
                if (!a.meal) return null;

                return (
                  <div
                    key={a.id}
                    className="group relative hover: group-[:border-red-900] transition-all duration-300 rounded-2xl border-4"
                  >
                    <div
                      className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl border  flex flex-col h-full"
                      style={{
                        background: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      {/* Image Container */}
                      <div className="relative w-full h-48 overflow-hidden" style={{ background: 'var(--color-bg)' }}>
                        {'imageUrl' in a.meal &&
                        typeof a.meal.imageUrl === 'string' &&
                        a.meal.imageUrl.trim() !== '' ? (
                          <Image
                            src={a.meal.imageUrl as string}
                            alt={a.meal.name}
                            fill
                            className="object-cover hover:scale-110 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, var(--color-bg-alt), var(--color-bg))' }}
                          >
                            <Utensils className="w-12 h-12" style={{ color: 'var(--color-text-muted)' }} />
                          </div>
                        )}

                        {/* Remove Button Overlay */}
                        {onRemove && (
                          <button
                            onClick={() => onRemove(a.id)}
                            className="absolute top-3 right-3 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            style={{
                              background: 'rgba(0,0,0,0.7)',
                              color: 'var(--color-danger)',
                            }}
                            title="Delete assignment for this client"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                        {/* Meal Type Badge */}
                        <div className="absolute top-3 left-3">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium uppercase"
                            style={{
                              background: 'var(--color-accent)',
                              color: 'var(--color-text-black)',
                            }}
                          >
                            {a.meal.type}
                          </span>
                        </div>
                      </div>

                      {/* Content Container */}
                      <div className="p-4 flex-1 flex flex-col">
                        {/* Meal Name */}
                        <h4 className="font-semibold text-lg mb-3 line-clamp-2" style={{ color: 'var(--color-text)' }}>
                          {a.meal.name}
                        </h4>

                        {/* Nutrition Grid */}
                        <div className="space-y-2 flex-1 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                              Calories
                            </span>
                            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                              {a.meal.calories}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                              Protein
                            </span>
                            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                              {a.meal.protein}g
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                              Carbs
                            </span>
                            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                              {a.meal.carbs}g
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                              Fat
                            </span>
                            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                              {a.meal.fat}g
                            </span>
                          </div>
                        </div>

                        {/* Assignment Date */}
                        <div className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={12} />
                            Assigned: {new Date(a.assignedDate).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Notes */}
                        {a.notes && (
                          <div
                            className="text-xs p-3 rounded-lg border mb-3"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <FileText size={12} className="mt-0.5 flex-shrink-0" />
                              <span className="leading-relaxed">{a.notes}</span>
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {a.meal.description && (
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                            {a.meal.description}
                          </p>
                        )}

                        {/* Action Buttons Container */}
                        <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                          <button
                            onClick={() => handleEditMeal(a.meal.id)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition active:scale-[0.98]"
                            style={{
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#3b82f6',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                            }}
                            title="Edit this personalized meal"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          {onRemove && (
                            <button
                              onClick={() => onRemove(a.id)}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition active:scale-[0.98]"
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                              }}
                              title="Delete assignment for this client only"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="text-center py-12 rounded-xl border"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <Utensils size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
              <p className="text-base font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                No {selectedFilter === 'ALL' ? '' : selectedFilter.toLowerCase() + ' '}meals found
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Try selecting a different filter or assign more meals
              </p>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<Utensils size={56} style={{ color: 'var(--color-text-muted)' }} />}
          title="No Meals Assigned"
          subtitle="This client does not have any assigned meals yet."
          buttonLabel="Assign First Meal"
          onClick={onAssign}
        />
      )}

      {/* Edit Meal Modal */}
      <EditMealModal
        isOpen={showEditModal}
        mealId={mealToEdit}
        onCloseAction={() => {
          setShowEditModal(false);
          setMealToEdit(null);
        }}
        onMealUpdatedAction={handleMealUpdated}
      />
    </section>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  buttonLabel,
  onClick,
}: {
  icon: JSX.Element;
  title: string;
  subtitle: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        {title}
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        {subtitle}
      </p>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition active:scale-[0.99]"
        style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
      >
        <PlusCircle size={18} />
        {buttonLabel}
      </button>
    </div>
  );
}
