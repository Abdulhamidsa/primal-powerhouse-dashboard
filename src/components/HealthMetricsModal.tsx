'use client';

import { useMemo, useState } from 'react';
import { PulseIcon as Activity, GaugeIcon as Gauge, TargetIcon as Target, TrendDownIcon as TrendingDown, TrendUpIcon as TrendingUp, XIcon as X } from '@phosphor-icons/react';
import type { HealthMetricsOutput } from '@/lib/health/calculators';
import { useHealthMetricsCalculator } from '@/features/health-metrics/hooks/useHealthMetricsCalculator';
import type {
  HealthMetricsCoachingPhase,
  HealthMetricsFormulaPreference,
  HealthMetricsGoal,
  HealthMetricsGoalDirection,
  HealthMetricsMacroMode,
  HealthMetricsOccupationActivity,
  HealthMetricsRequestPayload,
} from '@/features/health-metrics/types/healthMetrics.types';

interface HealthMetricsModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  clientId: string;
  clientName: string;
  clientData: {
    currentWeight: number | null;
    height: number | null;
    age: number | null;
    gender: string | null;
    activityLevel: string | null;
  };
  onSuccess?: (metrics: HealthMetricsOutput) => void;
}

const directionCards: Array<{
  value: HealthMetricsGoalDirection;
  label: string;
  subtitle: string;
  icon: typeof TrendingDown;
}> = [
  {
    value: 'LOSS',
    label: 'Fat Loss',
    subtitle: 'Create a controlled rate of loss with clear guardrails.',
    icon: TrendingDown,
  },
  {
    value: 'MAINTAIN',
    label: 'Maintain',
    subtitle: 'Hold intake near expenditure and protect performance.',
    icon: Activity,
  },
  {
    value: 'GAIN',
    label: 'Gain',
    subtitle: 'Use a measured surplus with quality gain targets.',
    icon: TrendingUp,
  },
];

const coachingPhases: Array<{ value: HealthMetricsCoachingPhase; label: string; description: string }> = [
  {
    value: 'GENERAL_FAT_LOSS',
    label: 'General Fat Loss',
    description: 'Default steady-loss setup for most active clients.',
  },
  {
    value: 'HARD_CUT',
    label: 'Hard Cut',
    description: 'Short, higher-pressure phase with stricter guardrails.',
  },
  {
    value: 'RECOMP',
    label: 'Recomp',
    description: 'Bias body composition while keeping training quality intact.',
  },
  {
    value: 'PERFORMANCE',
    label: 'Performance',
    description: 'Fuel training output, recovery, and workload tolerance.',
  },
  {
    value: 'LEAN_BULK',
    label: 'Lean Bulk',
    description: 'Controlled gain phase with a small productive surplus.',
  },
];

const macroModeOptions: Array<{ value: HealthMetricsMacroMode; label: string; description: string }> = [
  { value: 'BALANCED', label: 'Balanced', description: 'Even split for general coaching use.' },
  {
    value: 'HIGH_CARB_PERFORMANCE',
    label: 'High Carb Performance',
    description: 'Higher carb bias for training output and glycogen support.',
  },
  {
    value: 'HIGH_FAT_APPETITE_CONTROL',
    label: 'High Fat Appetite Control',
    description: 'Higher fat bias for satiety and appetite control.',
  },
  {
    value: 'PROTEIN_PRIORITY_CUT',
    label: 'Protein Priority Cut',
    description: 'Protein-forward split for tighter cutting phases.',
  },
];

const occupationOptions: Array<{ value: HealthMetricsOccupationActivity; label: string; description: string }> = [
  { value: 'DESK', label: 'Desk', description: 'Mostly seated workday' },
  { value: 'MIXED', label: 'Mixed', description: 'Blend of seated and on-feet work' },
  { value: 'PHYSICAL', label: 'Physical', description: 'Job involves regular manual movement' },
];

function getDefaultWeeklyRate(direction: HealthMetricsGoalDirection, phase: HealthMetricsCoachingPhase): string {
  if (direction === 'GAIN') return '0.25';
  if (direction === 'LOSS' && phase === 'HARD_CUT') return '1';
  if (direction === 'LOSS') return '0.5';
  if (direction === 'MAINTAIN' && phase === 'RECOMP') return '0.25';
  return '0.25';
}

function getDefaultMacroMode(phase: HealthMetricsCoachingPhase): HealthMetricsMacroMode {
  if (phase === 'HARD_CUT') return 'PROTEIN_PRIORITY_CUT';
  if (phase === 'PERFORMANCE') return 'HIGH_CARB_PERFORMANCE';
  return 'BALANCED';
}

function getLegacyGoal(
  goalDirection: HealthMetricsGoalDirection,
  phase: HealthMetricsCoachingPhase,
): HealthMetricsGoal {
  if (phase === 'HARD_CUT') return 'aggressive_cut';
  if (phase === 'RECOMP') return 'recomposition';
  if (phase === 'LEAN_BULK' || goalDirection === 'GAIN') return 'lean_bulk';
  if (goalDirection === 'MAINTAIN' || phase === 'PERFORMANCE') return 'maintenance';
  return 'fat_loss';
}

function surfaceButtonClass(active: boolean): string {
  return active
    ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-text)]'
    : 'border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[var(--color-text)]';
}

export default function HealthMetricsModal({
  isOpen,
  onCloseAction,
  clientId,
  clientName,
  clientData,
  onSuccess,
}: HealthMetricsModalProps) {
  const [weight, setWeight] = useState(clientData.currentWeight?.toString() || '');
  const [goalDirection, setGoalDirection] = useState<HealthMetricsGoalDirection>('LOSS');
  const [coachingPhase, setCoachingPhase] = useState<HealthMetricsCoachingPhase>('GENERAL_FAT_LOSS');
  const [weeklyRatePercent, setWeeklyRatePercent] = useState(getDefaultWeeklyRate('LOSS', 'GENERAL_FAT_LOSS'));
  const [averageDailySteps, setAverageDailySteps] = useState('8000');
  const [resistanceSessionsPerWeek, setResistanceSessionsPerWeek] = useState('4');
  const [cardioMinutesPerWeek, setCardioMinutesPerWeek] = useState('90');
  const [occupationActivity, setOccupationActivity] = useState<HealthMetricsOccupationActivity>('MIXED');
  const [formulaPreference, setFormulaPreference] = useState<HealthMetricsFormulaPreference>('auto');
  const [macroMode, setMacroMode] = useState<HealthMetricsMacroMode>(getDefaultMacroMode('GENERAL_FAT_LOSS'));
  const [bodyFatPercentage, setBodyFatPercentage] = useState('');
  const [waistCircumferenceCm, setWaistCircumferenceCm] = useState('');
  const [isLeanClient, setIsLeanClient] = useState(false);
  const [previewMetrics, setPreviewMetrics] = useState<HealthMetricsOutput | null>(null);

  const { submit, isSubmitting, error } = useHealthMetricsCalculator(clientId);

  const showWeeklyRate = goalDirection !== 'MAINTAIN' || coachingPhase === 'RECOMP';
  const canPreview = useMemo(() => {
    const parsedWeight = Number(weight);
    return (
      Number.isFinite(parsedWeight) &&
      parsedWeight > 0 &&
      Number.isFinite(Number(averageDailySteps)) &&
      Number.isFinite(Number(resistanceSessionsPerWeek)) &&
      Number.isFinite(Number(cardioMinutesPerWeek))
    );
  }, [averageDailySteps, cardioMinutesPerWeek, resistanceSessionsPerWeek, weight]);

  if (!isOpen) return null;

  const buildPayload = (mode: 'preview' | 'apply'): HealthMetricsRequestPayload => ({
    currentWeight: Number(weight),
    goal: getLegacyGoal(goalDirection, coachingPhase),
    goalDirection,
    coachingPhase,
    weeklyRatePercent: showWeeklyRate ? Number(weeklyRatePercent) : undefined,
    compositeActivity: {
      averageDailySteps: Number(averageDailySteps),
      resistanceSessionsPerWeek: Number(resistanceSessionsPerWeek),
      cardioMinutesPerWeek: Number(cardioMinutesPerWeek),
      occupationActivity,
    },
    formulaPreference,
    macroMode,
    bodyFatPercentage: bodyFatPercentage.trim() ? Number(bodyFatPercentage) : undefined,
    waistCircumferenceCm: waistCircumferenceCm.trim() ? Number(waistCircumferenceCm) : undefined,
    isLeanClient,
    mode,
  });

  const handleDirectionChange = (nextDirection: HealthMetricsGoalDirection) => {
    setGoalDirection(nextDirection);
    setWeeklyRatePercent(getDefaultWeeklyRate(nextDirection, coachingPhase));
  };

  const handleCoachingPhaseChange = (nextPhase: HealthMetricsCoachingPhase) => {
    setCoachingPhase(nextPhase);
    setWeeklyRatePercent(getDefaultWeeklyRate(goalDirection, nextPhase));
    setMacroMode(getDefaultMacroMode(nextPhase));
  };

  const handlePreview = async () => {
    const result = await submit(buildPayload('preview'));
    setPreviewMetrics(result.metrics);
  };

  const handleApply = async () => {
    const result = await submit(buildPayload('apply'));
    setPreviewMetrics(result.metrics);
    onSuccess?.(result.metrics);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-5xl overflow-y-auto rounded-3xl border shadow-2xl"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          maxHeight: '92vh',
        }}
      >
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b px-6 py-5 backdrop-blur"
          style={{ background: 'rgba(20, 20, 20, 0.96)', borderColor: 'var(--color-border)' }}
        >
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
              Health Metrics Calculator
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {clientName}
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseAction}
            className="rounded-xl border p-2"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section
              className="space-y-3 rounded-2xl border p-5"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
            >
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Current Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={event => setWeight(event.target.value)}
                className="w-full rounded-xl border px-4 py-3"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
              />
            </section>

            <section
              className="space-y-4 rounded-2xl border p-5"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
            >
              <div className="flex items-center gap-2">
                <Target size={16} style={{ color: 'var(--color-accent)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Goal Direction
                </h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {directionCards.map(card => {
                  const Icon = card.icon;
                  const active = goalDirection === card.value;
                  return (
                    <button
                      key={card.value}
                      type="button"
                      onClick={() => handleDirectionChange(card.value)}
                      className={`rounded-xl border px-4 py-4 text-left transition ${surfaceButtonClass(active)}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold">{card.label}</span>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-xs opacity-80">{card.subtitle}</p>
                    </button>
                  );
                })}
              </div>

              {showWeeklyRate ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    Target Weekly Rate (% bodyweight)
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    max={1.2}
                    step={0.05}
                    value={weeklyRatePercent}
                    onChange={event => setWeeklyRatePercent(event.target.value)}
                    className="w-full rounded-xl border px-4 py-3"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>
              ) : null}
            </section>

            <section
              className="space-y-4 rounded-2xl border p-5"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
            >
              <div className="flex items-center gap-2">
                <Gauge size={16} style={{ color: 'var(--color-accent)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Coaching Phase
                </h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {coachingPhases.map(phase => {
                  const active = coachingPhase === phase.value;
                  return (
                    <button
                      key={phase.value}
                      type="button"
                      onClick={() => handleCoachingPhaseChange(phase.value)}
                      className={`rounded-xl border px-4 py-4 text-left transition ${surfaceButtonClass(active)}`}
                    >
                      <p className="text-sm font-semibold">{phase.label}</p>
                      <p className="mt-1 text-xs opacity-80">{phase.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section
              className="space-y-4 rounded-2xl border p-5"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
            >
              <div className="flex items-center gap-2">
                <Activity size={16} style={{ color: 'var(--color-accent)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Activity Profile
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Average Daily Steps">
                  <input
                    type="number"
                    step="500"
                    value={averageDailySteps}
                    onChange={event => setAverageDailySteps(event.target.value)}
                    className="w-full rounded-xl border px-4 py-3"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  />
                </Field>
                <Field label="Resistance Sessions / Week">
                  <input
                    type="number"
                    min={0}
                    max={14}
                    value={resistanceSessionsPerWeek}
                    onChange={event => setResistanceSessionsPerWeek(event.target.value)}
                    className="w-full rounded-xl border px-4 py-3"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  />
                </Field>
                <Field label="Cardio Minutes / Week">
                  <input
                    type="number"
                    min={0}
                    value={cardioMinutesPerWeek}
                    onChange={event => setCardioMinutesPerWeek(event.target.value)}
                    className="w-full rounded-xl border px-4 py-3"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  />
                </Field>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  Occupation Activity
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  {occupationOptions.map(option => {
                    const active = occupationActivity === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setOccupationActivity(option.value)}
                        className={`rounded-xl border px-4 py-3 text-left transition ${surfaceButtonClass(active)}`}
                      >
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="mt-1 text-xs opacity-80">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section
              className="space-y-4 rounded-2xl border p-5"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
            >
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Advanced Inputs
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Formula Preference">
                  <select
                    value={formulaPreference}
                    onChange={event => setFormulaPreference(event.target.value as HealthMetricsFormulaPreference)}
                    className="w-full rounded-xl border px-4 py-3"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  >
                    <option value="auto">Auto (recommended)</option>
                    <option value="mifflin">Mifflin-St Jeor</option>
                    <option value="katch">Katch-McArdle</option>
                  </select>
                </Field>
                <Field label="Macro Mode">
                  <select
                    value={macroMode}
                    onChange={event => setMacroMode(event.target.value as HealthMetricsMacroMode)}
                    className="w-full rounded-xl border px-4 py-3"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {macroModeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {macroModeOptions.find(option => option.value === macroMode)?.description}
                  </p>
                </Field>
                <Field label="Body Fat % (optional)">
                  <input
                    type="number"
                    min={3}
                    max={60}
                    step="0.1"
                    value={bodyFatPercentage}
                    onChange={event => setBodyFatPercentage(event.target.value)}
                    className="w-full rounded-xl border px-4 py-3"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                    placeholder="e.g. 16.5"
                  />
                </Field>
                <Field label="Waist Circumference (cm)">
                  <input
                    type="number"
                    min={50}
                    max={150}
                    step="0.5"
                    value={waistCircumferenceCm}
                    onChange={event => setWaistCircumferenceCm(event.target.value)}
                    className="w-full rounded-xl border px-4 py-3"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                    placeholder="Optional"
                  />
                </Field>
              </div>
              <label
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
              >
                <input
                  type="checkbox"
                  checked={isLeanClient}
                  onChange={event => setIsLeanClient(event.target.checked)}
                />
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                  Treat as lean client for stricter deficit guardrails and higher-protein logic
                </span>
              </label>
            </section>

            {error?.message ? (
              <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: 'var(--color-accent)',
                  background: 'var(--color-accent-translucent)',
                  color: 'var(--color-text)',
                }}
              >
                {error.message}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handlePreview}
                disabled={!canPreview || isSubmitting}
                className="rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
                style={{ background: 'var(--color-accent)', color: 'var(--color-text-on-accent)' }}
              >
                {isSubmitting ? 'Working...' : 'Preview Calculation'}
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!previewMetrics || isSubmitting}
                className="rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-60"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
              >
                Apply To Client
              </button>
            </div>
          </div>

          <aside
            className="space-y-4 rounded-2xl border p-5"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Preview
            </h3>
            {previewMetrics ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="BMI" value={previewMetrics.bmi.toFixed(1)} />
                  <Metric label="BMR" value={`${previewMetrics.bmr}`} />
                  <Metric label="TDEE" value={`${previewMetrics.tdee}`} />
                  <Metric label="Daily kcal" value={`${previewMetrics.recommendedCalories}`} />
                  <Metric label="Protein" value={`${previewMetrics.macros.protein}g`} />
                  <Metric label="Carbs" value={`${previewMetrics.macros.carbs}g`} />
                  <Metric label="Fat" value={`${previewMetrics.macros.fat}g`} />
                  <Metric label="Coach Review" value={previewMetrics.requiresCoachReview ? 'Required' : 'No'} />
                </div>
                <div
                  className="rounded-xl border p-4 text-sm"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                >
                  <p className="mb-2 font-semibold" style={{ color: 'var(--color-text)' }}>
                    Calculation Details
                  </p>
                  <InfoRow label="Formula" value={previewMetrics.calculationDetails.formulaUsed.toUpperCase()} />
                  <InfoRow label="Activity Level" value={previewMetrics.calculationDetails.activityLevel} />
                  <InfoRow
                    label="Activity Multiplier"
                    value={previewMetrics.calculationDetails.activityMultiplier.toFixed(2)}
                  />
                  <InfoRow label="Goal Direction" value={previewMetrics.calculationDetails.goalDirection ?? 'N/A'} />
                  <InfoRow label="Phase" value={previewMetrics.calculationDetails.coachingPhase ?? 'N/A'} />
                  <InfoRow label="Macro Mode" value={previewMetrics.calculationDetails.macroMode ?? 'N/A'} />
                  <InfoRow
                    label="Adjustment"
                    value={`${previewMetrics.calculationDetails.goalAdjustmentCalories} kcal`}
                  />
                  <InfoRow
                    label="Protein"
                    value={`${previewMetrics.calculationDetails.proteinPerKg.toFixed(1)} g/kg`}
                  />
                  <InfoRow label="Fat Floor" value={`${previewMetrics.calculationDetails.fatFloorGrams} g`} />
                </div>
                {previewMetrics.calculationDetails.activityExplanation ? (
                  <Callout title="Activity rationale" body={previewMetrics.calculationDetails.activityExplanation} />
                ) : null}
                {previewMetrics.calculationDetails.proteinStrategy ? (
                  <Callout title="Protein strategy" body={previewMetrics.calculationDetails.proteinStrategy} />
                ) : null}
                {previewMetrics.safetyWarnings.length ? (
                  <div
                    className="rounded-xl border p-4"
                    style={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-translucent)' }}
                  >
                    <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      Safety Warnings
                    </p>
                    <ul className="space-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {previewMetrics.safetyWarnings.map(warning => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Run a preview to inspect calories, macros, safety warnings, and calculation rationale before applying
                the result.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border px-3 py-3"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span className="text-xs font-medium text-right" style={{ color: 'var(--color-text)' }}>
        {value}
      </span>
    </div>
  );
}

function Callout({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <p className="mb-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        {title}
      </p>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {body}
      </p>
    </div>
  );
}
