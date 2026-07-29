'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { CheckCircle2, ChevronDown, Dumbbell, Flame, Moon, PenLine, Salad, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/40 text-foreground">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function OptionGrid<T extends string>({
  options,
  selectedValue,
  disabled,
  onSelect,
  colsClassName,
}: {
  options: Array<ChoiceOption<T>>;
  selectedValue: T | null | undefined;
  disabled: boolean;
  onSelect: (value: T) => void;
  colsClassName: string;
}) {
  return (
    <div className={cn('grid gap-2 rounded-2xl border border-border bg-muted/20 p-2', colsClassName)}>
      {options.map(option => {
        const selected = selectedValue === option.value;

        return (
          <Button
            key={option.value}
            type="button"
            variant={selected ? 'default' : 'outline'}
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onSelect(option.value)}
            className={cn(
              'h-12 rounded-2xl px-3 text-sm font-medium shadow-none transition-all active:scale-[0.98]',
              selected ? 'border-primary bg-primary text-primary-foreground' : 'bg-background'
            )}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

function StatusPill({
  label,
  selected,
  tone = 'neutral',
}: {
  label: string;
  selected: boolean;
  tone?: 'neutral' | 'good' | 'warn';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
        selected
          ? tone === 'good'
            ? 'border-primary/20 bg-primary/10 text-primary'
            : tone === 'warn'
              ? 'border-amber-500/20 bg-amber-500/10 text-amber-700'
              : 'border-border bg-muted/60 text-foreground'
          : 'border-border bg-background text-muted-foreground'
      )}
    >
      {label}
    </span>
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
    <Card className="overflow-hidden rounded-[28px] border-border bg-card shadow-sm">
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5"
          aria-expanded={isExpanded}
          aria-label="Toggle daily check-in details"
        >
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight text-foreground">Today&apos;s Check-In</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {completionData.isComplete ? 'All done for today' : `${completionData.remaining} of 5 remaining`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DailyCompletionRing percentage={completionData.pct} size={58} strokeWidth={6} />
            <ChevronDown
              size={16}
              className={cn('text-muted-foreground transition-transform duration-300', isExpanded && 'rotate-180')}
            />
          </div>
        </button>

        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-out',
            isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="overflow-hidden">
            <div className="border-t border-border/60 px-4 pb-3 pt-1 sm:px-5">
              <div className="space-y-3">
                <section className="rounded-2xl border border-border bg-muted/20 p-3">
                  <SectionTitle
                    icon={Flame}
                    title="Energy"
                    subtitle="How your day feels so far"
                  />
                  <div className="mt-2.5">
                    <OptionGrid
                      options={ENERGY_OPTIONS}
                      selectedValue={entry?.energy}
                      disabled={anyLoading || savingField === 'energy'}
                      onSelect={value => void saveEnergy(value)}
                      colsClassName="grid-cols-3"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-muted/20 p-3">
                  <SectionTitle icon={Salad} title="Nutrition" subtitle="How closely today matched plan" />
                  <div className="mt-2.5">
                    <OptionGrid
                      options={NUTRITION_OPTIONS}
                      selectedValue={nutritionEntry?.status}
                      disabled={anyLoading || savingField === 'nutrition'}
                      onSelect={value => void saveNutrition(value)}
                      colsClassName="grid-cols-3"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-muted/20 p-3">
                  <SectionTitle icon={Dumbbell} title="Training" subtitle="Did you complete the session?" />
                  <div className="mt-2.5">
                    <OptionGrid
                      options={TRAINING_OPTIONS}
                      selectedValue={trainingEntry?.status}
                      disabled={anyLoading || savingField === 'training'}
                      onSelect={value => void saveTraining(value)}
                      colsClassName="grid-cols-3"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-muted/20 p-3">
                  <SectionTitle icon={Utensils} title="Hunger" subtitle="How hungry you feel right now" />
                  <div className="mt-2.5">
                    <OptionGrid
                      options={HUNGER_OPTIONS}
                      selectedValue={entry?.hunger}
                      disabled={anyLoading || savingField === 'hunger'}
                      onSelect={value => void saveHunger(value)}
                      colsClassName="grid-cols-3"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-muted/20 p-3">
                  <SectionTitle icon={Moon} title="Sleep" subtitle="How well you slept" />
                  <div className="mt-2.5">
                    <OptionGrid
                      options={SLEEP_OPTIONS}
                      selectedValue={entry?.sleep}
                      disabled={anyLoading || savingField === 'sleep'}
                      onSelect={value => void saveSleep(value)}
                      colsClassName="grid-cols-2 sm:grid-cols-4"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <SectionTitle
                      icon={PenLine}
                      title={noteOpen ? 'Note' : entry?.note ? 'Edit note' : 'Add note'}
                      subtitle="Optional quick note for today"
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
                    <div className="mt-2.5 space-y-2.5">
                      <textarea
                        value={noteValue}
                        onChange={e => setNoteValue(e.target.value)}
                        maxLength={500}
                        rows={4}
                        placeholder="Anything else to note today..."
                        className="min-h-[108px] w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                        <span className="ml-auto text-[11px] text-muted-foreground">{noteValue.length}/500</span>
                      </div>
                    </div>
                  ) : null}
                </section>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-background px-3 py-2.5">
                  {errorMessage ? (
                    <p className="text-xs font-medium text-destructive">{errorMessage}</p>
                  ) : completionData.isComplete ? (
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                      <CheckCircle2 size={14} />
                      All done for today.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{completionData.pct}% completed</p>
                  )}

                  <div className="flex items-center gap-2">
                    <StatusPill label="Energy" selected={Boolean(entry?.energy)} tone="good" />
                    <StatusPill label="Plan" selected={Boolean(nutritionEntry?.status)} tone="warn" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
