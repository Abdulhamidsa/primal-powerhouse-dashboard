import { CalendarDays, Utensils, FileText, PlusCircle, Trash2 } from 'lucide-react';
import { cx, iosPanel, iosPanelStyle } from '../../lib/ui';
import { MealAssignment } from '@/lib/client-page/types';
import { JSX } from 'react/jsx-dev-runtime';
import Image from 'next/image';

export function MealsTab({
  assignments,
  onAssign,
  onRemove,
}: {
  assignments: MealAssignment[];
  onAssign: () => void;
  onRemove?: (assignmentId: string) => Promise<void>;
}) {
  return (
    <section className={cx(iosPanel, 'p-5 sm:p-6')} style={iosPanelStyle}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h3 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Assigned Meals
        </h3>

        <button
          onClick={onAssign}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.99]"
          style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
        >
          <PlusCircle size={18} />
          Assign Meals
        </button>
      </div>

      {assignments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {assignments.map(a => {
            if (!a.meal) return null;

            return (
              <div key={a.id} className="group relative">
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border flex flex-col h-full"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  {/* Image Container */}
                  <div className="relative w-full h-48 overflow-hidden" style={{ background: 'var(--color-bg)' }}>
                    {'imageUrl' in a.meal && typeof a.meal.imageUrl === 'string' && a.meal.imageUrl.trim() !== '' ? (
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
                        title="Remove assignment"
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
                          color: 'var(--color-text-on-accent)',
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Utensils size={56} style={{ color: 'var(--color-text-muted)' }} />}
          title="No Meals Assigned"
          subtitle="This client does not have any assigned meals yet."
          buttonLabel="Assign First Meal"
          onClick={onAssign}
        />
      )}
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
