'use client';

import { useState } from 'react';
import {
  WarningCircleIcon as AlertCircle,
  CowIcon as Beef,
  DropIcon as Droplets,
  ShieldWarningIcon as ShieldAlert,
  TargetIcon as Target,
  TrashIcon as Trash2,
  GrainsIcon as Wheat,
} from '@phosphor-icons/react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { HealthMetricsOutput } from '@/lib/health/calculators';
import { useHealthMetricsNotes } from '@/features/health-metrics/hooks/useHealthMetricsNotes';

interface HealthMetricsResultsProps {
  clientId: string;
  metrics: HealthMetricsOutput;
  onCloseAction: () => void;
  onSaveNotesAction: (notes: string[]) => void;
}

const MACRO_CHART_COLORS = ['var(--color-accent)', 'rgba(184, 106, 78, 0.68)', 'rgba(245, 245, 245, 0.38)'];

export function HealthMetricsResults({ clientId, metrics, onSaveNotesAction }: HealthMetricsResultsProps) {
  const [notes, setNotes] = useState<string[]>(metrics.notes || []);
  const [newNote, setNewNote] = useState('');
  const { saveNotes, isSaving } = useHealthMetricsNotes(clientId);

  const macroChartData = [
    { name: 'Protein', value: metrics.macros.protein * 4 },
    { name: 'Carbs', value: metrics.macros.carbs * 4 },
    { name: 'Fat', value: metrics.macros.fat * 9 },
  ];

  const handleAddNote = async (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter' || !newNote.trim()) return;
    event.preventDefault();

    const updatedNotes = [...notes, newNote.trim()];
    setNotes(updatedNotes);
    setNewNote('');

    try {
      await saveNotes(updatedNotes);
      onSaveNotesAction(updatedNotes);
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  const removeNote = async (index: number) => {
    const updatedNotes = notes.filter((_, currentIndex) => currentIndex !== index);
    setNotes(updatedNotes);

    try {
      await saveNotes(updatedNotes);
      onSaveNotesAction(updatedNotes);
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  return (
    <div
      className="mt-6 rounded-3xl border p-6 shadow-lg md:p-8"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
            Health Metrics Results
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Coach-facing calorie, macro, and safety summary.
          </p>
        </div>
      </div>

      {metrics.requiresCoachReview ? (
        <div
          className="mb-6 flex items-start gap-3 rounded-2xl border px-4 py-4"
          style={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-translucent)' }}
        >
          <ShieldAlert
            aria-hidden="true"
            focusable="false"
            size={18}
            style={{ color: 'var(--color-accent)', marginTop: 2 }}
          />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Coach review required
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              This result triggered at least one guardrail and should be reviewed before being used as a prescription.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="BMI" value={metrics.bmi.toFixed(1)} caption={metrics.bmiCategory} />
        <MetricCard label="BMR" value={`${metrics.bmr}`} caption="kcal/day" />
        <MetricCard label="TDEE" value={`${metrics.tdee}`} caption="kcal/day" />
        <MetricCard label="Recommended Calories" value={`${metrics.recommendedCalories}`} caption="kcal/day" />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
        >
          <h3 className="mb-4 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Coaching Summary
          </h3>
          <div className="space-y-3 text-sm">
            <InfoRow label="BMI Category" value={metrics.bmiCategory} />
            <InfoRow label="Waist Risk" value={metrics.waistRisk ?? 'Not provided'} />
            <InfoRow label="Formula" value={metrics.calculationDetails.formulaUsed.toUpperCase()} />
            <InfoRow label="Activity Level" value={metrics.calculationDetails.activityLevel} />
            <InfoRow label="Activity Multiplier" value={metrics.calculationDetails.activityMultiplier.toFixed(2)} />
            <InfoRow label="Goal Direction" value={metrics.calculationDetails.goalDirection ?? 'N/A'} />
            <InfoRow label="Coaching Phase" value={metrics.calculationDetails.coachingPhase ?? 'N/A'} />
            <InfoRow label="Macro Mode" value={metrics.calculationDetails.macroMode ?? 'N/A'} />
            <InfoRow label="Goal Adjustment" value={`${metrics.calculationDetails.goalAdjustmentCalories} kcal`} />
            <InfoRow label="Protein Target" value={`${metrics.calculationDetails.proteinPerKg.toFixed(1)} g/kg`} />
            <InfoRow label="Fat Floor" value={`${metrics.calculationDetails.fatFloorGrams} g/day`} />
            <InfoRow
              label="Dynamic Floor"
              value={
                metrics.calculationDetails.dynamicCalorieFloor != null
                  ? `${metrics.calculationDetails.dynamicCalorieFloor} kcal`
                  : 'N/A'
              }
            />
          </div>
          {metrics.calculationDetails.activityExplanation ? (
            <div
              className="mt-4 rounded-xl border p-4"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              <p className="mb-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Activity rationale
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {metrics.calculationDetails.activityExplanation}
              </p>
            </div>
          ) : null}
          {metrics.calculationDetails.proteinStrategy ? (
            <div
              className="mt-4 rounded-xl border p-4"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              <p className="mb-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Protein strategy
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {metrics.calculationDetails.proteinStrategy}
              </p>
            </div>
          ) : null}
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
        >
          <h3 className="mb-4 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Macro Targets
          </h3>
          <div className="mb-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {macroChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={MACRO_CHART_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={value => `${value} kcal`}
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    color: 'var(--color-text)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <MacroCard
              label="Protein"
              value={`${metrics.macros.protein}g`}
              share={`${Math.round(((metrics.macros.protein * 4) / metrics.recommendedCalories) * 100)}%`}
              icon={<Beef aria-hidden="true" focusable="false" size={18} />}
            />
            <MacroCard
              label="Carbs"
              value={`${metrics.macros.carbs}g`}
              share={`${Math.round(((metrics.macros.carbs * 4) / metrics.recommendedCalories) * 100)}%`}
              icon={<Wheat aria-hidden="true" focusable="false" size={18} />}
            />
            <MacroCard
              label="Fat"
              value={`${metrics.macros.fat}g`}
              share={`${Math.round(((metrics.macros.fat * 9) / metrics.recommendedCalories) * 100)}%`}
              icon={<Droplets aria-hidden="true" focusable="false" size={18} />}
            />
          </div>
        </div>
      </div>

      {metrics.safetyWarnings.length ? (
        <div
          className="mb-8 rounded-2xl border p-5"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
        >
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle aria-hidden="true" focusable="false" size={16} style={{ color: 'var(--color-accent)' }} />
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
              Safety Warnings
            </h3>
          </div>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {metrics.safetyWarnings.map(warning => (
              <li
                key={warning}
                className="rounded-xl border px-4 py-3"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
              >
                {warning}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        className="mb-8 rounded-2xl border p-5"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
      >
        <div className="mb-3 flex items-center gap-2">
          <Target aria-hidden="true" focusable="false" size={16} style={{ color: 'var(--color-accent)' }} />
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Notes and Coaching Observations
          </h3>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={newNote}
            onChange={event => setNewNote(event.target.value)}
            onKeyDown={handleAddNote}
            disabled={isSaving}
            placeholder="Add a note and press Enter"
            className="w-full rounded-xl border px-4 py-3"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              opacity: isSaving ? 0.6 : 1,
            }}
          />
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Notes remain editable after calculation so the coach can add context.
          </p>
        </div>

        {notes.length ? (
          <div className="space-y-3">
            {notes.map((note, index) => (
              <div
                key={`${note}-${index}`}
                className="flex items-start justify-between gap-3 rounded-xl border px-4 py-4"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
              >
                <div className="flex-1">
                  <p style={{ color: 'var(--color-text)' }}>{note}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Note {index + 1}
                  </p>
                </div>
                <button
                  onClick={() => removeNote(index)}
                  disabled={isSaving}
                  className="rounded-lg p-2"
                  style={{ color: 'var(--color-text-muted)', opacity: isSaving ? 0.5 : 1 }}
                >
                  <Trash2 aria-hidden="true" focusable="false" size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl border px-4 py-6 text-center"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <AlertCircle
              aria-hidden="true"
              focusable="false"
              size={20}
              style={{ color: 'var(--color-text-muted)', margin: '0 auto 8px' }}
            />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No notes added yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-muted)' }}>
        {caption}
      </p>
    </div>
  );
}

function MacroCard({
  label,
  value,
  share,
  icon,
}: {
  label: string;
  value: string;
  share: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <div className="mb-3 flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
      <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {share} of total calories
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="text-right font-medium capitalize" style={{ color: 'var(--color-text)' }}>
        {value}
      </span>
    </div>
  );
}
