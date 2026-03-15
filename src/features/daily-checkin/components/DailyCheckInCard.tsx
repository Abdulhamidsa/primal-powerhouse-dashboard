'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DailyCompletionRing } from '@/features/daily-checkin/components/DailyCompletionRing';
import { calculateCompletionPercentage } from '@/features/daily-checkin/lib/dailyCheckInAnalytics';
import { useDailyCheckInToday, useUpsertDailyCheckIn } from '@/features/daily-checkin/hooks/useDailyCheckIn';
import type { DailyCheckInCompliance, DailyCheckInEnergy } from '@/features/daily-checkin/types/dailyCheckIn.types';

const COMPLIANCE_OPTIONS: Array<{ value: DailyCheckInCompliance; label: string }> = [
  { value: 'OFF_PLAN', label: 'Off Plan' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'ON_PLAN', label: 'On Plan' },
];

const ENERGY_OPTIONS: Array<{ value: DailyCheckInEnergy; label: string }> = [
  { value: 'LOW', label: 'LOW' },
  { value: 'NORMAL', label: 'NORMAL' },
  { value: 'HIGH', label: 'HIGH' },
];

export function DailyCheckInCard() {
  const { dayDate, entry, isLoading } = useDailyCheckInToday();
  const { submit } = useUpsertDailyCheckIn();
  const [weightValue, setWeightValue] = useState('');
  const [savingField, setSavingField] = useState<'weight' | 'compliance' | 'energy' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setWeightValue(entry?.weightKg != null ? entry.weightKg.toString() : '');
  }, [entry?.weightKg]);

  const previewPercentage = useMemo(() => {
    const parsedWeight = weightValue.trim() === '' ? null : Number(weightValue);
    return calculateCompletionPercentage({
      weightKg: Number.isFinite(parsedWeight) ? parsedWeight : (entry?.weightKg ?? null),
      compliance: entry?.compliance ?? null,
      energy: entry?.energy ?? null,
    });
  }, [entry?.compliance, entry?.energy, entry?.weightKg, weightValue]);

  const completionPercentage = entry?.completionPercentage ?? previewPercentage;

  async function saveWeight() {
    const trimmedValue = weightValue.trim();
    const parsedWeight = trimmedValue === '' ? null : Number(trimmedValue);
    const hasValidNumber = typeof parsedWeight === 'number' && Number.isFinite(parsedWeight);

    if (trimmedValue !== '' && (!hasValidNumber || parsedWeight <= 0)) {
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
      setErrorMessage('Could not save your compliance. Please try again.');
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
      setErrorMessage('Could not save your energy. Please try again.');
    } finally {
      setSavingField(null);
    }
  }

  return (
    <div className="rounded-3xl border border-emerald-500/15 bg-background/85 p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Daily Check-In</p>
              <p className="text-xs text-muted-foreground">Weight, compliance, and energy with less clutter.</p>
            </div>
          </div>
          <p className="max-w-xl text-sm text-foreground/75">
            Complete the three essentials and move on. This card is intentionally tighter so the next step stays
            obvious.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2.5 md:shrink-0">
          <DailyCompletionRing
            percentage={completionPercentage}
            size={68}
            strokeWidth={7}
            className="mx-auto md:mx-0"
          />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-accent" />
              <p className="text-sm font-medium text-foreground">Weight</p>
            </div>
            <span className="text-xs text-muted-foreground">kg</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={weightValue}
              onChange={event => setWeightValue(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void saveWeight();
                }
              }}
              placeholder="Enter weight"
              disabled={isLoading || savingField === 'weight'}
              className="sm:max-w-[180px]"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void saveWeight()}
              disabled={isLoading || savingField === 'weight'}
              className="sm:w-auto"
            >
              {savingField === 'weight' ? 'Saving...' : 'Save Weight'}
            </Button>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-border/70 bg-background/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">Compliance</p>
            <span className="text-xs text-muted-foreground">Required</span>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-background/60 p-1.5">
            {COMPLIANCE_OPTIONS.map(option => {
              const isActive = entry?.compliance === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  disabled={isLoading || savingField === 'compliance'}
                  onClick={() => void saveCompliance(option.value)}
                  className="rounded-xl border px-3 py-2.5 text-sm font-medium transition active:scale-[0.99]"
                  style={{
                    borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                    background: isActive ? 'var(--color-accent-muted)' : 'var(--color-card)',
                    opacity: isLoading || savingField === 'compliance' ? 0.7 : 1,
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-border/70 bg-background/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">Energy</p>
            <span className="text-xs text-muted-foreground">Required</span>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-background/60 p-1.5">
            {ENERGY_OPTIONS.map(option => {
              const isActive = entry?.energy === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  disabled={isLoading || savingField === 'energy'}
                  onClick={() => void saveEnergy(option.value)}
                  className="rounded-xl border px-3 py-2.5 text-sm font-semibold tracking-[0.06em] transition active:scale-[0.99]"
                  style={{
                    borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                    background: isActive ? 'var(--color-accent-muted)' : 'var(--color-card)',
                    opacity: isLoading || savingField === 'energy' ? 0.7 : 1,
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 min-h-5 px-1">
        {errorMessage ? (
          <p className="text-xs text-destructive">{errorMessage}</p>
        ) : entry?.isComplete ? (
          <p className="inline-flex items-center gap-1 text-xs text-emerald-700">
            <CheckCircle2 size={14} />
            Daily check-in complete.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{completionPercentage}% complete for today.</p>
        )}
      </div>
    </div>
  );
}
