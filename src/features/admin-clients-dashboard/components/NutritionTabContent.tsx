import { ClientNutritionComparisonPanel } from '@/features/client-nutrition-comparison/components/ClientNutritionComparisonPanel';
import type { MealAssignment } from '@/lib/client-page/types';

export function NutritionTabContent({
  clientId,
  mealAssignments,
}: {
  clientId: string;
  mealAssignments: MealAssignment[];
}) {
  const dailyCalories = mealAssignments.reduce(
    (sum, assignment) => sum + assignment.meal.calories * (assignment.portion ?? 1),
    0,
  );
  const sideCalories = mealAssignments.reduce((sum, assignment) => sum + (assignment.side?.calories ?? 0), 0);

  return (
    <div className="space-y-4">
      <ClientNutritionComparisonPanel clientId={clientId} />

      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Planned Nutrition Snapshot
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Based on currently assigned meals for this client. Side calories are tracked separately from main meals.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <Tile label="Assigned Meals" value={`${mealAssignments.length}`} />
          <Tile label="Planned Calories" value={`${Math.round(dailyCalories)} kcal`} />
          <Tile label="Side Calories" value={`${Math.round(sideCalories)} kcal`} />
          <Tile
            label="Average Per Meal"
            value={mealAssignments.length ? `${Math.round(dailyCalories / mealAssignments.length)} kcal` : '0 kcal'}
          />
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border px-3 py-2"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="text-sm font-semibold mt-1" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
    </div>
  );
}
