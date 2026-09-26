'use client';

import { useEffect, useMemo, useState, type ComponentType, type CSSProperties } from 'react';
import { CheckCircleIcon as CheckCircle2, BarbellIcon as Dumbbell, FlameIcon as Flame, MoonIcon as Moon, PencilLineIcon as PenLine, BowlFoodIcon as Salad, ForkKnifeIcon as Utensils } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

type ChoiceOption<T> = {
  value: T;
  label: string;
};

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-bg-alt)] text-[var(--color-text)]">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight text-[var(--color-text)]">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  selectedValue,
  disabled,
  onSelect,
}: {
  options: Array<ChoiceOption<T>>;
  selectedValue: T | null | undefined;
  disabled: boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <div
      className="grid grid-cols-[repeat(var(--option-count),minmax(0,1fr))] gap-1 rounded-[20px] bg-[var(--color-bg-alt)] p-1"
      style={{ '--option-count': options.length } as CSSProperties}
    >
      {options.map(option => {
        const selected = selectedValue === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onSelect(option.value)}
            className={cn(
              'min-h-11 rounded-2xl px-2 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60',
              selected
                ? 'bg-[var(--color-text)] text-[var(--color-bg)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function CheckInMetric<T extends string>({
  icon,
  title,
  subtitle,
  options,
  selectedValue,
  disabled,
  onSelect,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle: string;
  options: Array<ChoiceOption<T>>;
  selectedValue: T | null | undefined;
  disabled: boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <section className="space-y-2.5 border-t border-[var(--color-border)]/60 py-3 first:border-t-0 first:pt-0">
      <SectionTitle icon={icon} title={title} subtitle={subtitle} />
      <SegmentedControl options={options} selectedValue={selectedValue} disabled={disabled} onSelect={onSelect} />
    </section>
  );
}

export function DailyCheckInCard() {
  const { dayDate, entry, isLoading } = useDailyCheckInToday();
  const { submit } = useUpsertDailyCheckIn();
  const { entry: nutritionEntry, isLoading: nutritionLoading } = useDailyNutritionToday();
  const { submit: submitNutrition } = useUpsertDailyNutrition();
  const { entry: trainingEntry, isLoading: trainingLoading } = useDailyTrainingToday();
  const { submit: submitTraining } = useUpsertDailyTraining();

  const [savingField, setSavingField] = useState<SavingField>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    <div
      className="overflow-hidden rounded-[28px] border shadow-sm"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-tight text-[var(--color-text)]">Today</p>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {completionData.isComplete ? 'All done today' : `${completionData.remaining} left`}
          </p>
        </div>
        <div
          className="rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{
            background: completionData.isComplete ? 'var(--color-accent-translucent)' : 'var(--color-bg-alt)',
            color: completionData.isComplete ? 'var(--color-accent)' : 'var(--color-text-muted)',
          }}
        >
          {completionData.isComplete ? '5/5 complete' : `${completionData.pct}%`}
        </div>
      </div>

      <div className="px-4 pb-3 sm:px-5">
        <CheckInMetric
          icon={Flame}
          title="Energy"
          subtitle="How your day feels so far"
          options={ENERGY_OPTIONS}
          selectedValue={entry?.energy}
          disabled={anyLoading || savingField === 'energy'}
          onSelect={value => void saveEnergy(value)}
        />

        <CheckInMetric
          icon={Salad}
          title="Nutrition"
          subtitle="How closely today matched plan"
          options={NUTRITION_OPTIONS}
          selectedValue={nutritionEntry?.status}
          disabled={anyLoading || savingField === 'nutrition'}
          onSelect={value => void saveNutrition(value)}
        />

        <CheckInMetric
          icon={Dumbbell}
          title="Training"
          subtitle="Did you complete the session?"
          options={TRAINING_OPTIONS}
          selectedValue={trainingEntry?.status}
          disabled={anyLoading || savingField === 'training'}
          onSelect={value => void saveTraining(value)}
        />

        <CheckInMetric
          icon={Utensils}
          title="Hunger"
          subtitle="How hungry you feel right now"
          options={HUNGER_OPTIONS}
          selectedValue={entry?.hunger}
          disabled={anyLoading || savingField === 'hunger'}
          onSelect={value => void saveHunger(value)}
        />

        <CheckInMetric
          icon={Moon}
          title="Sleep"
          subtitle="How well you slept"
          options={SLEEP_OPTIONS}
          selectedValue={entry?.sleep}
          disabled={anyLoading || savingField === 'sleep'}
          onSelect={value => void saveSleep(value)}
        />

        <section className="border-t border-[var(--color-border)]/60 py-3">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle
              icon={PenLine}
              title={noteOpen ? 'Note' : entry?.note ? 'Edit note' : 'Add note'}
              subtitle={entry?.note && !noteOpen ? entry.note : 'Optional quick note for today'}
            />
            {!noteOpen ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-full px-3 text-xs"
                onClick={() => setNoteOpen(true)}
              >
                {entry?.note ? 'Edit' : 'Add'}
              </Button>
            ) : null}
          </div>

          {noteOpen ? (
            <div className="mt-3 space-y-2.5">
              <textarea
                value={noteValue}
                onChange={e => setNoteValue(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Anything else to note today..."
                className="min-h-[92px] w-full resize-none rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-translucent)]"
              />

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  disabled={savingField === 'note'}
                  onClick={() => void saveNote()}
                  className="h-10 rounded-full px-4"
                >
                  Save note
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingField === 'note'}
                  onClick={() => {
                    setNoteOpen(false);
                    setNoteValue(entry?.note ?? '');
                  }}
                  className="h-10 rounded-full px-4"
                >
                  Cancel
                </Button>
                <span className="ml-auto text-[11px] text-[var(--color-text-muted)]">{noteValue.length}/500</span>
              </div>
            </div>
          ) : null}
        </section>

        <div className="border-t border-[var(--color-border)]/60 pt-3">
          {errorMessage ? (
            <p className="text-xs font-medium text-destructive">{errorMessage}</p>
          ) : completionData.isComplete ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)]">
              <CheckCircle2 aria-hidden="true" focusable="false" size={14} />
              All done for today.
            </p>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">{completionData.remaining} items left to complete today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
