import { CalendarDays, Utensils, FileText, PlusCircle, Trash2, Flame, Drumstick, Wheat, Droplet } from 'lucide-react';
import { cx, iosCardStyle, iosPanel, iosPanelStyle } from '../../lib/ui';
import { MealAssignment } from '@/lib/client-page/types';
import { JSX } from 'react/jsx-dev-runtime';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {assignments.map(a => {
            if (!a.meal) return null;

            return (
              <div key={a.id} className="border rounded-2xl p-4 transition shadow-sm" style={iosCardStyle}>
                <div className="flex items-start gap-3">
                  {/* Meal Icon */}
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 border"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                  >
                    <Utensils className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Meal Name */}
                    <h4 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                      {a.meal.name}
                    </h4>

                    {/* Meal Type Badge */}
                    <div className="mt-1">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase"
                        style={{
                          background: 'var(--color-accent-muted)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        {a.meal.type}
                      </span>
                    </div>

                    {/* Macros Grid */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <div
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        <Flame size={12} style={{ color: 'var(--color-accent)' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                            {a.meal.calories}
                          </span>{' '}
                          cal
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        <Drumstick size={12} style={{ color: '#ff6b6b' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                            {a.meal.protein}
                          </span>
                          g
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        <Wheat size={12} style={{ color: '#f59e0b' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                            {a.meal.carbs}
                          </span>
                          g
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        <Droplet size={12} style={{ color: '#3b82f6' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                            {a.meal.fat}
                          </span>
                          g
                        </span>
                      </div>
                    </div>

                    {/* Assignment Date */}
                    <div className="mt-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={10} /> Assigned: {new Date(a.assignedDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Notes */}
                    {a.notes && (
                      <div
                        className="mt-2 text-[11px] p-2 rounded-xl border"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <FileText size={12} className="mt-[2px]" />
                          <span className="leading-snug">{a.notes}</span>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {a.meal.description && (
                      <div className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                        {a.meal.description}
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  {onRemove && (
                    <button
                      onClick={() => onRemove(a.id)}
                      className="p-2 rounded-xl border transition active:scale-[0.99]"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-accent)',
                      }}
                      title="Remove assignment"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
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
