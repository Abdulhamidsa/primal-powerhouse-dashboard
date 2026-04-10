'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Dumbbell, Flame, Moon, PenLine, Salad, Utensils } from 'lucide-react';
import { DailyCompletionRing } from '@/features/daily-checkin/components/DailyCompletionRing';
import { calculateCompletionPercentage, getCompletionCount } from '@/features/daily-checkin/lib/dailyCheckInAnalytics';
import { useDailyCheckInToday, useUpsertDailyCheckIn } from '@/features/daily-checkin/hooks/useDailyCheckIn';
import { useDailyNutritionToday, useUpsertDailyNutrition } from '@/features/daily-nutrition/hooks/useDailyNutrition';
import { useDailyTrainingToday, useUpsertDailyTraining } from '@/features/daily-training/hooks/useDailyTraining';
import type {
  DailyCheckInEnergy,
  DailyCheckInHunger,
  DailyCheckInSleep,
} from '@/features/daily-checkin/types/dailyCheckIn.types';
import type { DailyNutritionStatus } from '@/features/daily-nutrition/types/dailyNutrition.types';
import type { DailyTrainingStatus } from '@/features/daily-training/types/dailyTraining.types';

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

const HUNGER_OPTIONS: Array<{ value: DailyCheckInHunger; label: string }> = [
  { value: 'SATISFIED', label: 'Satisfied' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'HUNGRY', label: 'Hungry' },
];

const SLEEP_OPTIONS: Array<{ value: DailyCheckInSleep; label: string }> = [
  { value: 'POOR', label: 'Poor' },
  { value: 'OKAY', label: 'Okay' },
  { value: 'GOOD', label: 'Good' },
  { value: 'GREAT', label: 'Great' },
];

type SavingField = 'energy' | 'nutrition' | 'training' | 'hunger' | 'sleep' | 'note' | null;

export function DailyCheckInCard() {
  const { dayDate, entry, isLoading } = useDailyCheckInToday();
  const { submit } = useUpsertDailyCheckIn();
  const { entry: nutritionEntry, isLoading: nutritionLoading } = useDailyNutritionToday();
  const { submit: submitNutrition } = useUpsertDailyNutrition();
  const { entry: trainingEntry, isLoading: trainingLoading } = useDailyTrainingToday();
  const { submit: submitTraining } = useUpsertDailyTraining();

  const [savingField, setSavingField] = useState<SavingField>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteValue, setNoteValue] = useState('');

  useEffect(() => {
    setNoteValue(entry?.note ?? '');
  }, [entry?.note]);

  const completionData = useMemo(() => {
    const input = {
      energy: entry?.energy ?? null,
      hunger: entry?.hunger ?? null,
      sleep: entry?.sleep ?? null,
      nutritionStatus: nutritionEntry?.status ?? null,
      trainingStatus: trainingEntry?.status ?? null,
    };
    const pct = calculateCompletionPercentage(input);
    const remaining = 5 - getCompletionCount(input);
    return { pct, remaining, isComplete: pct === 100 };
  }, [entry?.energy, entry?.hunger, entry?.sleep, nutritionEntry?.status, trainingEntry?.status]);

  const anyLoading = isLoading || nutritionLoading || trainingLoading;

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

  async function saveHunger(hunger: DailyCheckInHunger) {
    try {
      setSavingField('hunger');
      setErrorMessage(null);
      await submit(dayDate, { hunger });
    } catch {
      setErrorMessage('Could not save. Please try again.');
    } finally {
      setSavingField(null);
    }
  }

  async function saveSleep(sleep: DailyCheckInSleep) {
    try {
      setSavingField('sleep');
      setErrorMessage(null);
      await submit(dayDate, { sleep });
    } catch {
      setErrorMessage('Could not save. Please try again.');
    } finally {
      setSavingField(null);
    }
  }

  async function saveNote() {
    try {
      setSavingField('note');
      setErrorMessage(null);
      await submit(dayDate, { note: noteValue });
      setNoteOpen(false);
    } catch {
      setErrorMessage('Could not save note. Please try again.');
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
        className="flex w-full items-center justify-between gap-4 px-2 py-2 text-left"
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
            <div className="divide-y divide-border/50">
              {/* Energy */}
              <div className="px-2 py-2">
                <div className="mb-3 flex items-center gap-2">
                  <Flame size={14} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Energy</p>
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
              <div className="px-2 py-2">
                <div className="mb-3 flex items-center gap-2">
                  <Salad size={14} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Nutrition</p>
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
              <div className="px-2 py-2">
                <div className="mb-3 flex items-center gap-2">
                  <Dumbbell size={14} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Training</p>
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

              {/* Hunger */}
              <div className="px-2 py-2">
                <div className="mb-3 flex items-center gap-2">
                  <Utensils size={14} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Hunger</p>
                </div>
                <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-background/60 p-1">
                  {HUNGER_OPTIONS.map(option => {
                    const isActive = entry?.hunger === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={isActive}
                        disabled={anyLoading || savingField === 'hunger'}
                        onClick={() => void saveHunger(option.value)}
                        className="rounded-xl border py-2.5 text-sm font-medium transition-all active:scale-[0.97]"
                        style={{
                          borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                          background: isActive ? 'var(--color-accent-muted)' : 'var(--color-card)',
                          opacity: anyLoading || savingField === 'hunger' ? 0.6 : 1,
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sleep */}
              <div className="px-2 py-2">
                <div className="mb-3 flex items-center gap-2">
                  <Moon size={14} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Sleep</p>
                </div>
                <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-background/60 p-1">
                  {SLEEP_OPTIONS.map(option => {
                    const isActive = entry?.sleep === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={isActive}
                        disabled={anyLoading || savingField === 'sleep'}
                        onClick={() => void saveSleep(option.value)}
                        className="rounded-xl border py-2.5 text-sm font-medium transition-all active:scale-[0.97]"
                        style={{
                          borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                          background: isActive ? 'var(--color-accent-muted)' : 'var(--color-card)',
                          opacity: anyLoading || savingField === 'sleep' ? 0.6 : 1,
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add note (optional) */}
              <div className="px-2 py-2">
                {!noteOpen ? (
                  <button
                    type="button"
                    onClick={() => setNoteOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <PenLine size={13} />
                    <span>
                      {entry?.note ? 'Edit note' : 'Add note'} <span className="opacity-60">(optional)</span>
                    </span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={noteValue}
                      onChange={e => setNoteValue(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Anything else to note today..."
                      className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={savingField === 'note'}
                        onClick={() => void saveNote()}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
                        style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
                      >
                        Save note
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNoteOpen(false);
                          setNoteValue(entry?.note ?? '');
                        }}
                        className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <span className="ml-auto text-[10px] text-muted-foreground">{noteValue.length}/500</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer status */}
            <div className="px-5 py-3.5">
              {errorMessage ? (
                <p className="text-xs text-[var(--color-accent)]">{errorMessage}</p>
              ) : completionData.isComplete ? (
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)]">
                  <CheckCircle2 size={14} className="text-[var(--color-accent)]" />
                  All done for today.
                </p>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)]">{completionData.pct}% completed</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
