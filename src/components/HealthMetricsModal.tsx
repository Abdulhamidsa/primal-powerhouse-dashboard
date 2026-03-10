'use client';

import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, ChevronDown, ChevronUp, TrendingDown, TrendingUp, X } from 'lucide-react';
import type { HealthMetricsOutput } from '@/lib/health/calculators';
import { useHealthMetricsCalculator } from '@/features/health-metrics/hooks/useHealthMetricsCalculator';
import type {
  HealthMetricsActivityOverride,
  HealthMetricsFormulaPreference,
  HealthMetricsGoal,
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

const goalCards: Array<{
  value: HealthMetricsGoal;
  label: string;
  subtitle: string;
  icon: typeof TrendingDown;
  tone: 'danger' | 'warning' | 'info' | 'success' | 'neutral';
}> = [
  {
    value: 'fat_loss',
    label: 'Fat Loss',
    subtitle: 'Steady deficit with muscle retention focus',
    icon: TrendingDown,
    tone: 'warning',
  },
  {
    value: 'aggressive_cut',
    label: 'Aggressive Cut',
    subtitle: 'High-pressure short phase with strict guardrails',
    icon: AlertTriangle,
    tone: 'danger',
  },
  {
    value: 'recomposition',
    label: 'Recomposition',
    subtitle: 'Small deficit while pushing performance',
    icon: Activity,
    tone: 'info',
  },
  {
    value: 'lean_bulk',
    label: 'Lean Bulk',
    subtitle: 'Controlled surplus with quality gain target',
    icon: TrendingUp,
    tone: 'success',
  },
  {
    value: 'maintenance',
    label: 'Maintenance',
    subtitle: 'Stabilize output and preserve current composition',
    icon: Activity,
    tone: 'neutral',
  },
];

const activityOptions: Array<{ value: HealthMetricsActivityOverride; label: string; description: string }> = [
  { value: 'SEDENTARY', label: 'Sedentary', description: 'Desk job, minimal training volume' },
  { value: 'LIGHT', label: 'Light', description: '2-3 sessions/week or active lifestyle' },
  { value: 'MODERATE', label: 'Moderate', description: '4-5 sessions/week with regular movement' },
  { value: 'VERY_ACTIVE', label: 'Very Active', description: 'Intense training most days' },
  { value: 'ATHLETE', label: 'Athlete', description: 'High training load, performance priority' },
];

function normalizeActivityForSelection(activityLevel: string | null): HealthMetricsActivityOverride {
  const key = (activityLevel ?? '').trim().toUpperCase();
  if (key === 'LOW' || key === 'SEDENTARY') return 'SEDENTARY';
  if (key === 'LIGHT') return 'LIGHT';
  if (key === 'MODERATE') return 'MODERATE';
  if (key === 'HIGH' || key === 'VERY_ACTIVE') return 'VERY_ACTIVE';
  if (key === 'ATHLETE') return 'ATHLETE';
  return 'MODERATE';
}

function getGoalWeeklyRateDefault(goal: HealthMetricsGoal): number {
  if (goal === 'aggressive_cut') return 1;
  if (goal === 'fat_loss') return 0.5;
  if (goal === 'lean_bulk') return 0.25;
  return 0.3;
}

function toneClasses(tone: 'danger' | 'warning' | 'info' | 'success' | 'neutral', active: boolean): string {
  if (!active) return 'border-border bg-background text-foreground';
  if (tone === 'danger') return 'border-red-400/70 bg-red-500/15 text-red-300';
  if (tone === 'warning') return 'border-amber-400/70 bg-amber-500/15 text-amber-300';
  if (tone === 'info') return 'border-cyan-400/70 bg-cyan-500/15 text-cyan-300';
  if (tone === 'success') return 'border-emerald-400/70 bg-emerald-500/15 text-emerald-300';
  return 'border-accent/50 bg-accent/15 text-accent';
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
  const [goal, setGoal] = useState<HealthMetricsGoal>('fat_loss');
  const [activityOverride, setActivityOverride] = useState<HealthMetricsActivityOverride>(
    normalizeActivityForSelection(clientData.activityLevel)
  );
  const [weeklyRatePercent, setWeeklyRatePercent] = useState(getGoalWeeklyRateDefault('fat_loss').toString());
  const [formulaPreference, setFormulaPreference] = useState<HealthMetricsFormulaPreference>('auto');
  const [bodyFatPercentage, setBodyFatPercentage] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [previewMetrics, setPreviewMetrics] = useState<HealthMetricsOutput | null>(null);

  const { submit, isSubmitting, error } = useHealthMetricsCalculator(clientId);

  const showWeeklyRate = goal === 'fat_loss' || goal === 'aggressive_cut' || goal === 'lean_bulk';

  const canPreview = useMemo(() => {
    const parsedWeight = Number(weight);
    return Number.isFinite(parsedWeight) && parsedWeight > 0;
  }, [weight]);

  if (!isOpen) return null;

  const buildPayload = (mode: 'preview' | 'apply'): HealthMetricsRequestPayload => ({
    currentWeight: Number(weight),
    goal,
    mode,
    activityLevelOverride: activityOverride,
    weeklyRatePercent: showWeeklyRate ? Number(weeklyRatePercent) : undefined,
    formulaPreference,
    bodyFatPercentage: bodyFatPercentage.trim() ? Number(bodyFatPercentage) : undefined,
  });

  const handleGoalChange = (nextGoal: HealthMetricsGoal) => {
    setGoal(nextGoal);
    setWeeklyRatePercent(getGoalWeeklyRateDefault(nextGoal).toString());
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
        className="w-full max-w-3xl overflow-y-auto rounded-3xl border shadow-2xl"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          maxHeight: '90vh',
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Health Metrics Calculator</h2>
            <p className="mt-1 text-sm text-muted-foreground">{clientName}</p>
          </div>
          <button type="button" onClick={onCloseAction} className="rounded-lg p-2 hover:bg-muted">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Current Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={event => setWeight(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              required
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Goal Strategy</label>
              {goal === 'aggressive_cut' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> High stress mode
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {goalCards.map(card => {
                const Icon = card.icon;
                const active = goal === card.value;
                return (
                  <button
                    key={card.value}
                    type="button"
                    onClick={() => handleGoalChange(card.value)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${toneClasses(card.tone, active)}`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-semibold">{card.label}</span>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-xs opacity-85">{card.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {showWeeklyRate ? (
            <section className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Target Weekly Rate (% bodyweight)</label>
              <input
                type="number"
                min={0.1}
                max={1.2}
                step={0.05}
                value={weeklyRatePercent}
                onChange={event => setWeeklyRatePercent(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </section>
          ) : null}

          <section className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Activity Profile</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {activityOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setActivityOverride(option.value)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    activityOverride === option.value
                      ? 'border-accent/50 bg-accent/15 text-accent'
                      : 'border-border bg-background text-foreground'
                  }`}
                >
                  <div className="text-sm font-semibold">{option.label}</div>
                  <div className="text-xs opacity-80">{option.description}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-background/70">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(prev => !prev)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold text-foreground">Advanced Options</span>
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {isAdvancedOpen ? (
              <div className="space-y-4 border-t border-border px-4 py-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Formula Preference</label>
                  <select
                    value={formulaPreference}
                    onChange={event => setFormulaPreference(event.target.value as HealthMetricsFormulaPreference)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                  >
                    <option value="auto">Auto (recommended)</option>
                    <option value="mifflin">Mifflin-St Jeor</option>
                    <option value="katch">Katch-McArdle</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Body Fat % (optional)</label>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    step={0.1}
                    value={bodyFatPercentage}
                    onChange={event => setBodyFatPercentage(event.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                    placeholder="e.g. 16.5"
                  />
                </div>
              </div>
            ) : null}
          </section>

          {error?.message ? (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error.message}
            </div>
          ) : null}

          {previewMetrics ? (
            <section className="space-y-3 rounded-2xl border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-foreground">Preview</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="BMI" value={previewMetrics.bmi.toFixed(1)} />
                <Metric label="BMR" value={`${previewMetrics.bmr}`} />
                <Metric label="TDEE" value={`${previewMetrics.tdee}`} />
                <Metric label="Daily kcal" value={`${previewMetrics.recommendedCalories}`} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Metric label="Protein" value={`${previewMetrics.macros.protein}g`} />
                <Metric label="Carbs" value={`${previewMetrics.macros.carbs}g`} />
                <Metric label="Fat" value={`${previewMetrics.macros.fat}g`} />
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                <p className="mb-2 font-semibold text-foreground">How calculated</p>
                <p>Formula: {previewMetrics.calculationDetails.formulaUsed.toUpperCase()}</p>
                <p>Activity multiplier: {previewMetrics.calculationDetails.activityMultiplier.toFixed(3)}</p>
                <p>Goal adjustment: {previewMetrics.calculationDetails.goalAdjustmentCalories} kcal/day</p>
                <p>Protein floor: {previewMetrics.calculationDetails.proteinPerKg.toFixed(1)} g/kg</p>
                <p>Fat floor: {previewMetrics.calculationDetails.fatFloorGrams} g/day</p>
              </div>
            </section>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handlePreview}
              disabled={!canPreview || isSubmitting}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {isSubmitting ? 'Working...' : 'Preview Calculation'}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!previewMetrics || isSubmitting}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Apply To Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
