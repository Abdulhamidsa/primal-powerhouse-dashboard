'use client';

import { useState } from 'react';
import { BowlFoodIcon as Salad, CheckCircleIcon as CheckCircle2 } from '@phosphor-icons/react';
import { useDailyNutritionToday, useUpsertDailyNutrition } from '@/features/daily-nutrition/hooks/useDailyNutrition';
import type { DailyNutritionStatus } from '@/features/daily-nutrition/types/dailyNutrition.types';

const OPTIONS: Array<{ status: DailyNutritionStatus; label: string; helper: string }> = [
  { status: 'ON_PLAN', label: 'On Plan', helper: "Stuck to today's meal plan" },
  { status: 'PARTIAL', label: 'Partial', helper: 'Mostly on plan with small deviations' },
  { status: 'OFF_PLAN', label: 'Off Plan', helper: 'Could not follow the plan today' },
];

function statusLabel(status: DailyNutritionStatus): string {
  if (status === 'ON_PLAN') return 'On Plan';
  if (status === 'PARTIAL') return 'Partial';
  return 'Off Plan';
}

export function DailyNutritionCard() {
  const { dayDate, entry, isLoading } = useDailyNutritionToday();
  const { submit } = useUpsertDailyNutrition();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedStatus = entry?.status ?? null;

  const handleSelect = async (status: DailyNutritionStatus) => {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await submit(dayDate, status);
    } catch {
      setErrorMessage('Could not save your nutrition status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="rounded-3xl border p-4 md:p-5"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-card)' }}
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className="grid h-9 w-9 place-items-center rounded-full"
          style={{ background: 'var(--color-accent-muted)' }}
        >
          <Salad aria-hidden="true" focusable="false" className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Nutrition
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Mark today&apos;s status.
          </p>
        </div>
      </div>

      <div
        className="grid grid-cols-3 gap-2 rounded-2xl"
        style={{ background: 'var(--color-bg-alt)', padding: '0.35rem' }}
      >
        {OPTIONS.map(option => {
          const isActive = selectedStatus === option.status;
          return (
            <button
              key={option.status}
              type="button"
              disabled={isLoading || isSaving}
              onClick={() => handleSelect(option.status)}
              className="rounded-xl border px-2 py-2.5 text-center transition active:scale-[0.99]"
              style={{
                borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                background: isActive ? 'var(--color-accent-muted)' : 'var(--color-card)',
                opacity: isLoading || isSaving ? 0.7 : 1,
              }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {option.label}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-3 min-h-5 px-1">
        {errorMessage ? (
          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
            {errorMessage}
          </p>
        ) : selectedStatus ? (
          <p className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
            <CheckCircle2 aria-hidden="true" focusable="false" size={14} />
            Today saved as {statusLabel(selectedStatus)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
