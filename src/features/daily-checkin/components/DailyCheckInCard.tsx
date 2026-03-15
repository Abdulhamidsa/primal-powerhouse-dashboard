'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Dumbbell, Salad, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DailyCompletionRing } from '@/features/daily-checkin/components/DailyCompletionRing';
import { calculateCompletionPercentage, getCompletionCount } from '@/features/daily-checkin/lib/dailyCheckInAnalytics';
import { useDailyCheckInToday, useUpsertDailyCheckIn } from '@/features/daily-checkin/hooks/useDailyCheckIn';
import { useDailyNutritionToday, useUpsertDailyNutrition } from '@/features/daily-nutrition/hooks/useDailyNutrition';
import { useDailyTrainingToday, useUpsertDailyTraining } from '@/features/daily-training/hooks/useDailyTraining';
import type { DailyCheckInCompliance, DailyCheckInEnergy } from '@/features/daily-checkin/types/dailyCheckIn.types';
import type { DailyNutritionStatus } from '@/features/daily-nutrition/types/dailyNutrition.types';
import type { DailyTrainingStatus } from '@/features/daily-training/types/dailyTraining.types';

const COMPLIANCE_OPTIONS: Array<{ value: DailyCheckInCompliance; label: string }> = [
  { value: 'OFF_PLAN', label: 'Off Plan' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'ON_PLAN', label: 'On Plan' },
];

const ENERGY_OPTIONS: Array<{ value: DailyCheckInEnergy; label: string }> = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
];

const NUTRITION_OPTIONS: Array<{ value: DailyNutritionStatus; label: string }> = [
  { value: 'ON_PLAN', label: 'On Plan' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'OFF_PLAN', label: 'Off Plan' },
];

const TRAINING_OPTIONS: Array<{ value: DailyTrainingStatus; label: string }> = [
  { value: 'DONE', label: 'Done' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'MISSED', label: 'Missed' },
];

type SavingField = 'weight' | 'compliance' | 'energy' | 'nutrition' | 'training' | null;

function parseWeightInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/,/g, '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function DailyCheckInCard() {
  const { dayDate, entry, isLoading } = useDailyCheckInToday();
  const { submit } = useUpsertDailyCheckIn();
  const { entry: nutritionEntry, isLoading: nutritionLoading } = useDailyNutritionToday();
  const { submit: submitNutrition } = useUpsertDailyNutrition();
  const { entry: trainingEntry, isLoading: trainingLoading } = useDailyTrainingToday();
  const { submit: submitTraining } = useUpsertDailyTraining();

  const [weightValue, setWeightValue] = useState('');
  const [savingField, setSavingField] = useState<SavingField>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setWeightValue(entry?.weightKg != null ? entry.weightKg.toString() : '');
  }, [entry?.weightKg]);

  // Always derive from live hook data so the ring updates instantly on every tap
  const completionData = useMemo(() => {
    const parsedWeight = parseWeightInput(weightValue);
    const input = {
      weightKg: Number.isFinite(parsedWeight) ? parsedWeight : (entry?.weightKg ?? null),
      compliance: entry?.compliance ?? null,
      energy: entry?.energy ?? null,
      nutritionStatus: nutritionEntry?.status ?? null,
      trainingStatus: trainingEntry?.status ?? null,
    };
    const pct = calculateCompletionPercentage(input);
    const remaining = 5 - getCompletionCount(input);
    return { pct, remaining, isComplete: pct === 100 };
  }, [entry?.compliance, entry?.energy, entry?.weightKg, nutritionEntry?.status, trainingEntry?.status, weightValue]);

  const anyLoading = isLoading || nutritionLoading || trainingLoading;

  async function saveWeight() {
    const parsedWeight = parseWeightInput(weightValue);
    const trimmedValue = weightValue.trim();
    if (trimmedValue !== '' && (parsedWeight == null || parsedWeight <= 0)) {
      setErrorMessage('Enter a valid weight in kilograms.');
      return;
    }
    try {
      setSavingField('weight');
      setErrorMessage(null);
      await submit(dayDate, { weightKg: parsedWeight });
    } catch {
      setErrorMessage('Could not save your weight. Please try again.');
    } finally {
      setSavingField(null);
    }
  }

  async function saveCompliance(compliance: DailyCheckInCompliance) {
    try {
      setSavingField('compliance');
      setErrorMessage(null);
      await submit(dayDate, { compliance });
    } catch {
      setErrorMessage('Could not save. Please try again.');
    } finally {
      setSavingField(null);
    }
  }

  async function saveEnergy(energy: DailyCheckInEnergy) {
    try {
      setSavingField('energy');
      setErrorMessage(null);
      await submit(dayDate, { energy });
    } catch {
      setErrorMessage('Could not save. Please try again.');
    } finally {
      setSavingField(null);
    }
  }

  async function saveNutrition(status: DailyNutritionStatus) {
    try {
      setSavingField('nutrition');
      setErrorMessage(null);
      await submitNutrition(dayDate, status);
    } catch {
      setErrorMessage('Could not save nutrition status. Please try again.');
    } finally {
      setSavingField(null);
    }
  }

  async function saveTraining(status: DailyTrainingStatus) {
    try {
      setSavingField('training');
      setErrorMessage(null);
      await submitTraining(dayDate, status);
    } catch {
      setErrorMessage('Could not save training status. Please try again.');
    } finally {
      setSavingField(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={isExpanded}
        aria-label="Toggle daily check-in details"
      >
        <div>
          <p className="text-base font-semibold text-foreground">Today&apos;s Check-In</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completionData.isComplete ? 'All done for today' : `${completionData.remaining} of 5 remaining`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DailyCompletionRing percentage={completionData.pct} size={56} strokeWidth={6} />
          <ChevronDown
            size={16}
            className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div
            className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'} border-t border-border/50`}
          >
            {/* Sections — iOS-style grouped rows */}
            <div className="divide-y divide-border/50">
              {/* Weight */}
              <div className="px-5 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <Scale size={14} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Weight</p>
                  {entry?.weightKg != null && (
                    <span className="ml-auto text-xs font-semibold text-accent">{entry.weightKg} kg</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={weightValue}
                    onChange={e => setWeightValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void saveWeight();
                      }
                    }}
                    placeholder="e.g. 80,2"
                    disabled={anyLoading || savingField === 'weight'}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void saveWeight()}
                    disabled={anyLoading || savingField === 'weight'}
                    className="shrink-0"
                  >
                    {savingField === 'weight' ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>

              {/* Compliance */}
              <div className="px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Compliance</p>
                  {entry?.compliance && (
                    <span className="text-xs font-semibold text-accent">
                      {entry.compliance === 'ON_PLAN'
                        ? 'On Plan'
                        : entry.compliance === 'PARTIAL'
                          ? 'Partial'
                          : 'Off Plan'}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-background/60 p-1">
                  {COMPLIANCE_OPTIONS.map(option => {
                    const isActive = entry?.compliance === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={isActive}
                        disabled={anyLoading || savingField === 'compliance'}
                        onClick={() => void saveCompliance(option.value)}
                        className="rounded-xl border py-2.5 text-sm font-medium transition-all active:scale-[0.97]"
                        style={{
                          borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                          background: isActive ? 'var(--color-accent-muted)' : 'var(--color-card)',
                          opacity: anyLoading || savingField === 'compliance' ? 0.6 : 1,
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Energy */}
              <div className="px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Energy</p>
                  {entry?.energy && (
                    <span className="text-xs font-semibold text-accent capitalize">{entry.energy.toLowerCase()}</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-background/60 p-1">
                  {ENERGY_OPTIONS.map(option => {
                    const isActive = entry?.energy === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={isActive}
                        disabled={anyLoading || savingField === 'energy'}
                        onClick={() => void saveEnergy(option.value)}
                        className="rounded-xl border py-2.5 text-sm font-medium transition-all active:scale-[0.97]"
                        style={{
                          borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                          background: isActive ? 'var(--color-accent-muted)' : 'var(--color-card)',
                          opacity: anyLoading || savingField === 'energy' ? 0.6 : 1,
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nutrition */}
              <div className="px-5 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <Salad size={14} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Nutrition</p>
                  {nutritionEntry?.status && (
                    <span className="ml-auto text-xs font-semibold text-accent">
                      {nutritionEntry.status === 'ON_PLAN'
                        ? 'On Plan'
                        : nutritionEntry.status === 'PARTIAL'
                          ? 'Partial'
                          : 'Off Plan'}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-background/60 p-1">
                  {NUTRITION_OPTIONS.map(option => {
                    const isActive = nutritionEntry?.status === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={isActive}
                        disabled={anyLoading || savingField === 'nutrition'}
                        onClick={() => void saveNutrition(option.value)}
                        className="rounded-xl border py-2.5 text-sm font-medium transition-all active:scale-[0.97]"
                        style={{
                          borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                          background: isActive ? 'var(--color-accent-muted)' : 'var(--color-card)',
                          opacity: anyLoading || savingField === 'nutrition' ? 0.6 : 1,
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Training */}
              <div className="px-5 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <Dumbbell size={14} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Training</p>
                  {trainingEntry?.status && (
                    <span className="ml-auto text-xs font-semibold text-accent capitalize">
                      {trainingEntry.status.toLowerCase()}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-background/60 p-1">
                  {TRAINING_OPTIONS.map(option => {
                    const isActive = trainingEntry?.status === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={isActive}
                        disabled={anyLoading || savingField === 'training'}
                        onClick={() => void saveTraining(option.value)}
                        className="rounded-xl border py-2.5 text-sm font-medium transition-all active:scale-[0.97]"
                        style={{
                          borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                          background: isActive ? 'var(--color-accent-muted)' : 'var(--color-card)',
                          opacity: anyLoading || savingField === 'training' ? 0.6 : 1,
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer status */}
            <div className="px-5 py-3.5">
              {errorMessage ? (
                <p className="text-xs text-destructive">{errorMessage}</p>
              ) : completionData.isComplete ? (
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 size={14} />
                  All done for today.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{completionData.pct}% complete for today.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
