'use client';

import { useState } from 'react';
import { Dumbbell, CheckCircle2 } from 'lucide-react';
import {
  useDailyTrainingToday,
  useUpsertDailyTraining,
} from '@/features/daily-training/hooks/useDailyTraining';
import type { DailyTrainingStatus } from '@/features/daily-training/types/dailyTraining.types';

const OPTIONS: Array<{ status: DailyTrainingStatus; label: string; helper: string }> = [
  { status: 'DONE', label: 'Done', helper: 'Completed all planned training' },
  { status: 'PARTIAL', label: 'Partial', helper: 'Completed part of today\'s training' },
  { status: 'MISSED', label: 'Missed', helper: 'Did not complete today\'s training' },
];

function statusLabel(status: DailyTrainingStatus): string {
  if (status === 'DONE') return 'Done';
  if (status === 'PARTIAL') return 'Partial';
  return 'Missed';
}

export function DailyTrainingCard() {
  const { dayDate, entry, isLoading } = useDailyTrainingToday();
  const { submit } = useUpsertDailyTraining();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedStatus = entry?.status ?? null;

  const handleSelect = async (status: DailyTrainingStatus) => {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await submit(dayDate, status);
    } catch {
      setErrorMessage('Could not save your training status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      <div className="flex items-start gap-3 mb-4">
        <Dumbbell className="w-6 h-6 mt-0.5" style={{ color: 'var(--color-accent)' }} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
            Today Training Check
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            How did training go today?
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {OPTIONS.map(option => {
          const isActive = selectedStatus === option.status;
          return (
            <button
              key={option.status}
              type="button"
              disabled={isLoading || isSaving}
              onClick={() => handleSelect(option.status)}
              className="rounded-2xl border p-4 text-left transition active:scale-[0.99]"
              style={{
                borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                background: isActive ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
                opacity: isLoading || isSaving ? 0.7 : 1,
              }}
            >
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {option.label}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {option.helper}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-3 min-h-5">
        {errorMessage ? (
          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
            {errorMessage}
          </p>
        ) : selectedStatus ? (
          <p className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
            <CheckCircle2 size={14} />
            Today saved as {statusLabel(selectedStatus)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
