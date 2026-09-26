'use client';

import { useRouter } from 'next/navigation';
import { PulseIcon as Activity, CalendarCheckIcon as CalendarCheck2, CheckCircleIcon as CheckCircle2, PencilLineIcon as PencilLine } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useWeeklyCheckInCurrentWeek } from '@/features/weekly-checkin/hooks/useWeeklyCheckIn';
import { formatDateLabel } from '@/features/weekly-checkin/utils/week';

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--color-bg-alt)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-muted)]">
      {label}
    </span>
  );
}

export function WeeklyCheckInCard() {
  const router = useRouter();
  const { checkIn, status, isLoading } = useWeeklyCheckInCurrentWeek();

  if (isLoading) {
    return <div className="h-24 w-full animate-pulse rounded-[26px] bg-[var(--color-surface)]" />;
  }

  const dueLabel = status === 'overdue' ? 'Overdue' : status === 'due' ? 'Due' : 'Completed';

  if (!checkIn) {
    return (
      <div
        className="flex items-center justify-between gap-3 rounded-[26px] border p-4 shadow-sm"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
            <Activity aria-hidden="true" focusable="false" className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold tracking-tight text-[var(--color-text)]">Weekly Check-In</p>
              <StatusBadge label={dueLabel} />
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Track your progress for this week.</p>
          </div>
        </div>
        <Button className="h-10 shrink-0 rounded-full px-4" onClick={() => router.push('/user/check-in')}>
          Start
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-[26px] border p-4 shadow-sm"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
          <CalendarCheck2 aria-hidden="true" focusable="false" className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold tracking-tight text-[var(--color-text)]">This Week</p>
            <StatusBadge label={dueLabel} />
          </div>
          <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <CheckCircle2 aria-hidden="true" focusable="false" className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            <span>Submitted {formatDateLabel(checkIn.submittedAt)}</span>
          </div>
        </div>
      </div>
      <Button
        aria-label="Edit this week's check-in"
        className="h-10 w-10 shrink-0 rounded-full"
        size="icon"
        variant="outline"
        onClick={() => router.push('/user/check-in')}
      >
        <PencilLine aria-hidden="true" focusable="false" className="h-4 w-4" />
      </Button>
    </div>
  );
}
