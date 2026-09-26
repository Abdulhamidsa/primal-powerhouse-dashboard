import { FlameIcon as Flame, CowIcon as Beef, GrainsIcon as Wheat, DropIcon as Droplets, WarningCircleIcon as AlertCircle } from '@phosphor-icons/react/ssr';
import { cx, iosPanel, iosPanelStyle } from '@/lib/ui';

interface HealthMetricsWidgetProps {
  bmi: number | null;
  goalCalories: number | null;
  goalMacros: { protein: number; carbs: number; fat: number } | null;
  bmiCategory: string;
  onUpdate: () => void;
}

export function HealthMetricsWidget({
  bmi,
  goalCalories,
  goalMacros,
  bmiCategory,
  onUpdate,
}: HealthMetricsWidgetProps) {
  const getBMIColor = (category: string) => {
    switch (category) {
      case 'underweight':
        return { bg: '#3b82f6', text: '#1e40af' };
      case 'normal':
        return { bg: '#10b981', text: '#065f46' };
      case 'overweight':
        return { bg: '#f97316', text: '#92400e' };
      case 'obese':
        return { bg: '#ef4444', text: '#7f1d1d' };
      default:
        return { bg: '#6b7280', text: '#374151' };
    }
  };

  if (!bmi || !goalCalories || !goalMacros) {
    return (
      <div className={cx(iosPanel, 'p-6')} style={iosPanelStyle}>
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle aria-hidden="true" focusable="false" size={24} style={{ color: 'var(--color-text-muted)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Health Metrics
          </h3>
        </div>
        <p style={{ color: 'var(--color-text-muted)' }} className="text-sm mb-4">
          Health metrics not yet calculated. Update the client&apos;s weight to get personalized calorie and macro
          recommendations.
        </p>
        <button
          onClick={onUpdate}
          className="w-full py-2 rounded-lg font-semibold transition"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-text-on-accent)',
          }}
        >
           Calculate Now
        </button>
      </div>
    );
  }

  const colors = getBMIColor(bmiCategory);

  return (
    <div className={cx(iosPanel, 'p-6')} style={iosPanelStyle}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          Health Metrics
        </h3>
        <button
          onClick={onUpdate}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-text-on-accent)',
          }}
        >
          Update
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* BMI Card */}
        <div
          className="rounded-xl p-4 border"
          style={{
            background: colors.bg + '15',
            borderColor: colors.bg,
          }}
        >
          <p style={{ color: colors.text }} className="text-xs font-semibold mb-1">
            BMI
          </p>
          <p style={{ color: colors.text }} className="text-2xl font-bold">
            {bmi.toFixed(1)}
          </p>
          <p style={{ color: colors.text }} className="text-xs opacity-75 mt-1">
            {bmiCategory}
          </p>
        </div>

        {/* Daily Calories */}
        <div
          className="rounded-xl p-4 border"
          style={{
            background: 'rgba(255, 107, 107, 0.1)',
            borderColor: '#ff6b6b',
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Flame aria-hidden="true" focusable="false" size={14} style={{ color: '#ff6b6b' }} />
            <p style={{ color: '#ff6b6b' }} className="text-xs font-semibold">
              DAILY KCAL
            </p>
          </div>
          <p style={{ color: '#ff6b6b' }} className="text-2xl font-bold">
            {goalCalories}
          </p>
        </div>
      </div>

      {/* Macros */}
      <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <p style={{ color: 'var(--color-text-muted)' }} className="text-xs font-semibold mb-3">
          MACRO TARGETS
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2"
              style={{
                background: 'rgba(255, 107, 107, 0.1)',
              }}
            >
              <Beef aria-hidden="true" focusable="false" size={20} style={{ color: '#ff6b6b' }} />
            </div>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mb-1">
              Protein
            </p>
            <p style={{ color: '#ff6b6b' }} className="text-lg font-bold">
              {goalMacros.protein}g
            </p>
          </div>

          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2"
              style={{
                background: 'rgba(78, 205, 196, 0.1)',
              }}
            >
              <Wheat aria-hidden="true" focusable="false" size={20} style={{ color: '#4ecdc4' }} />
            </div>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mb-1">
              Carbs
            </p>
            <p style={{ color: '#4ecdc4' }} className="text-lg font-bold">
              {goalMacros.carbs}g
            </p>
          </div>

          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2"
              style={{
                background: 'rgba(255, 217, 61, 0.1)',
              }}
            >
              <Droplets aria-hidden="true" focusable="false" size={20} style={{ color: '#ffd93d' }} />
            </div>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mb-1">
              Fat
            </p>
            <p style={{ color: '#ffd93d' }} className="text-lg font-bold">
              {goalMacros.fat}g
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
