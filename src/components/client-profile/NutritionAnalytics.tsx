import {
  FlameIcon as Flame,
  CowIcon as Beef,
  GrainsIcon as Wheat,
  DropIcon as Droplets,
  LeafIcon as Leaf,
  ForkKnifeIcon as Utensils,
} from '@phosphor-icons/react/ssr';
import { cx, iosPanel, iosPanelStyle } from '@/lib/ui';
import { MealAssignment } from '@/lib/client-page/types';
import { calculateNutritionStats, getMacroPercentages } from '@/lib/nutrition-calculations';

export function NutritionAnalytics({ assignments }: { assignments: MealAssignment[] }) {
  const stats = calculateNutritionStats(assignments);

  const formatMealType = (value: string) =>
    value
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());

  const weeklyProteinPercent = getMacroPercentages(stats.weeklyTotals).protein;
  const weeklyCarbsPercent = getMacroPercentages(stats.weeklyTotals).carbs;
  const weeklyFatPercent = getMacroPercentages(stats.weeklyTotals).fat;

  if (assignments.length === 0) {
    return (
      <div className={cx(iosPanel, 'p-6 text-center')} style={iosPanelStyle}>
        <Utensils
          aria-hidden="true"
          focusable="false"
          size={40}
          className="mx-auto mb-3"
          style={{ color: 'var(--color-text-muted)' }}
        />
        <p style={{ color: 'var(--color-text-muted)' }}>
          No meals assigned yet. Assign meals to see nutrition analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Summary */}
      <div className={cx(iosPanel, 'p-6')} style={iosPanelStyle}>
        <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
          Weekly Nutrition Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Calories Card */}
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
              borderColor: 'rgba(255,107,107,0.3)',
              boxShadow: '0 8px 24px rgba(255,107,107,0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Flame aria-hidden="true" focusable="false" size={24} style={{ color: 'rgba(255,255,255,0.9)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                WEEKLY
              </span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Calories
            </p>
            <p className="text-3xl font-bold text-white mt-1">{Math.round(stats.weeklyTotals.calories)}</p>
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {Math.round(stats.dailyAverages.calories)} per day avg
            </p>
          </div>

          {/* Protein Card */}
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: 'linear-gradient(135deg, #ff6b9d, #ff8bb1)',
              borderColor: 'rgba(255,107,157,0.3)',
              boxShadow: '0 8px 24px rgba(255,107,157,0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Beef aria-hidden="true" focusable="false" size={24} style={{ color: 'rgba(255,255,255,0.9)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {weeklyProteinPercent}%
              </span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Protein
            </p>
            <p className="text-3xl font-bold text-white mt-1">{Math.round(stats.weeklyTotals.protein)}g</p>
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {Math.round(stats.dailyAverages.protein)}g per day
            </p>
          </div>

          {/* Carbs Card */}
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: 'linear-gradient(135deg, #4ecdc4, #6ee7de)',
              borderColor: 'rgba(78,205,196,0.3)',
              boxShadow: '0 8px 24px rgba(78,205,196,0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Wheat aria-hidden="true" focusable="false" size={24} style={{ color: 'rgba(255,255,255,0.9)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {weeklyCarbsPercent}%
              </span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Carbs
            </p>
            <p className="text-3xl font-bold text-white mt-1">{Math.round(stats.weeklyTotals.carbs)}g</p>
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {Math.round(stats.dailyAverages.carbs)}g per day
            </p>
          </div>

          {/* Fat Card */}
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: 'linear-gradient(135deg, #ffd93d, #ffe66d)',
              borderColor: 'rgba(255,217,61,0.3)',
              boxShadow: '0 8px 24px rgba(255,217,61,0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Droplets aria-hidden="true" focusable="false" size={24} style={{ color: 'rgba(0,0,0,0.7)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(0,0,0,0.6)' }}>
                {weeklyFatPercent}%
              </span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(0,0,0,0.6)' }}>
              Fat
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: '#000' }}>
              {Math.round(stats.weeklyTotals.fat)}g
            </p>
            <p className="text-xs mt-2" style={{ color: 'rgba(0,0,0,0.5)' }}>
              {Math.round(stats.dailyAverages.fat)}g per day
            </p>
          </div>

          {/* Fiber Card */}
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: 'linear-gradient(135deg, #95e1d3, #b8f3ea)',
              borderColor: 'rgba(149,225,211,0.3)',
              boxShadow: '0 8px 24px rgba(149,225,211,0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Leaf aria-hidden="true" focusable="false" size={24} style={{ color: 'rgba(255,255,255,0.9)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                BONUS
              </span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Fiber
            </p>
            <p className="text-3xl font-bold text-white mt-1">{Math.round(stats.weeklyTotals.fiber ?? 0)}g</p>
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {Math.round(stats.dailyAverages.fiber ?? 0)}g per day
            </p>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className={cx(iosPanel, 'p-6')} style={iosPanelStyle}>
        <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
          Daily Breakdown
        </h3>

        <div className="space-y-4">
          {stats.byDay.map(day => {
            const dayProteinPercent = getMacroPercentages(day).protein;
            const dayCarbsPercent = getMacroPercentages(day).carbs;
            const dayFatPercent = getMacroPercentages(day).fat;

            return (
              <div
                key={day.dayOfWeek}
                className="rounded-xl p-5 border"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                    {day.dayName}
                  </h4>
                  <span
                    className="px-3 py-1 rounded-lg text-sm font-semibold"
                    style={{
                      background: 'rgba(255,107,107,0.1)',
                      color: '#ff6b6b',
                    }}
                  >
                    {Math.round(day.calories)} kcal
                  </span>
                </div>

                {/* Macro bars */}
                <div className="space-y-3">
                  {/* Protein bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        Protein
                      </span>
                      <span className="text-xs font-bold" style={{ color: '#ff6b6b' }}>
                        {Math.round(day.protein)}g ({dayProteinPercent}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(dayProteinPercent, 100)}%`,
                          background: '#ff6b6b',
                        }}
                      />
                    </div>
                  </div>

                  {/* Carbs bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        Carbs
                      </span>
                      <span className="text-xs font-bold" style={{ color: '#4ecdc4' }}>
                        {Math.round(day.carbs)}g ({dayCarbsPercent}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(dayCarbsPercent, 100)}%`,
                          background: '#4ecdc4',
                        }}
                      />
                    </div>
                  </div>

                  {/* Fat bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        Fat
                      </span>
                      <span className="text-xs font-bold" style={{ color: '#ffd93d' }}>
                        {Math.round(day.fat)}g ({dayFatPercent}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(dayFatPercent, 100)}%`,
                          background: '#ffd93d',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Meal Type Breakdown */}
      {stats.byMealType.length > 0 && (
        <div className={cx(iosPanel, 'p-6')} style={iosPanelStyle}>
          <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
            By Meal Type
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.byMealType.map(mealType => {
              const mealProteinPercent = getMacroPercentages(mealType).protein;
              const mealCarbsPercent = getMacroPercentages(mealType).carbs;
              const mealFatPercent = getMacroPercentages(mealType).fat;

              return (
                <div
                  key={mealType.mealType}
                  className="rounded-xl p-5 border"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
                        {formatMealType(mealType.mealType)}
                      </h4>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {mealType.mealCount} meal{mealType.mealCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: '#ff6b6b' }}>
                        {Math.round(mealType.calories)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        kcal
                      </p>
                    </div>
                  </div>

                  {/* Circular macro visualization */}
                  <div className="flex items-center justify-around mb-4">
                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center relative"
                        style={{
                          background: `conic-gradient(#ff6b6b 0deg ${mealProteinPercent * 3.6}deg, var(--color-bg) ${mealProteinPercent * 3.6}deg)`,
                        }}
                      >
                        <div
                          className="w-14 h-14 rounded-full flex flex-col items-center justify-center"
                          style={{ background: 'var(--color-surface)' }}
                        >
                          <p className="text-xs font-bold" style={{ color: '#ff6b6b' }}>
                            {Math.round(mealType.protein)}g
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Pro
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center relative"
                        style={{
                          background: `conic-gradient(#4ecdc4 0deg ${mealCarbsPercent * 3.6}deg, var(--color-bg) ${mealCarbsPercent * 3.6}deg)`,
                        }}
                      >
                        <div
                          className="w-14 h-14 rounded-full flex flex-col items-center justify-center"
                          style={{ background: 'var(--color-surface)' }}
                        >
                          <p className="text-xs font-bold" style={{ color: '#4ecdc4' }}>
                            {Math.round(mealType.carbs)}g
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Carbs
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center relative"
                        style={{
                          background: `conic-gradient(#ffd93d 0deg ${mealFatPercent * 3.6}deg, var(--color-bg) ${mealFatPercent * 3.6}deg)`,
                        }}
                      >
                        <div
                          className="w-14 h-14 rounded-full flex flex-col items-center justify-center"
                          style={{ background: 'var(--color-surface)' }}
                        >
                          <p className="text-xs font-bold" style={{ color: '#ffd93d' }}>
                            {Math.round(mealType.fat)}g
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Fat
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div
        className="rounded-xl p-6 border"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="grid grid-cols-3 text-center gap-4">
          <div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Total Meals
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-accent)' }}>
              {stats.mealCount}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Days with Meals
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-accent)' }}>
              {stats.daysWithMeals}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Meal Types
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-accent)' }}>
              {stats.byMealType.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
