import { useState } from 'react';
import type { AdminClientWeeklyCheckInsResponse } from '@/features/weekly-checkin/types/adminWeeklyCheckIn.types';

function getStatusStyles(status: 'completed' | 'due' | 'overdue') {
  if (status === 'completed') {
    return {
      bg: 'var(--color-accent-muted)',
      color: 'var(--color-accent)',
      label: 'Completed',
    };
  }

  if (status === 'overdue') {
    return {
      bg: 'var(--color-danger-muted, var(--color-bg-alt))',
      color: 'var(--color-danger)',
      label: 'Overdue',
    };
  }

  return {
    bg: 'var(--color-bg-alt)',
    color: 'var(--color-text-muted)',
    label: 'Due',
  };
}

export function CheckInsTabContent({
  data,
  isLoading,
  isError,
  onDeleteAction,
  onResetAction,
}: {
  data: AdminClientWeeklyCheckInsResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  onDeleteAction: (checkInId: string) => Promise<void>;
  onResetAction: () => Promise<void>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const currentStatus = data?.currentWeek ? getStatusStyles(data.currentWeek.status) : null;

  const handleDelete = async (checkInId: string) => {
    const confirmed = window.confirm('Delete this weekly check-in entry?');
    if (!confirmed) return;

    try {
      setDeletingId(checkInId);
      await onDeleteAction(checkInId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm('Reset all weekly check-ins for this client?');
    if (!confirmed) return;

    try {
      setIsResetting(true);
      await onResetAction();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
          Weekly Check-Ins
        </h3>
        <div className="flex items-center gap-2">
          {currentStatus ? (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: currentStatus.bg, color: currentStatus.color }}
            >
              {currentStatus.label}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || !data?.checkIns.length}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{
              background: 'var(--color-bg-alt)',
              color: 'var(--color-danger)',
              opacity: isResetting || !data?.checkIns.length ? 0.6 : 1,
            }}
          >
            {isResetting ? 'Resetting...' : 'Reset All'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading check-ins...
        </p>
      ) : isError ? (
        <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
          Failed to load weekly check-ins.
        </p>
      ) : data?.checkIns.length ? (
        <div className="space-y-2">
          {data.checkIns.map(checkIn => (
            <div
              key={checkIn.id}
              className="rounded-lg border p-3 flex items-center justify-between gap-3"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  Week of {new Date(checkIn.weekStartDate).toLocaleDateString()}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Submitted {new Date(checkIn.submittedAt).toLocaleDateString()} | Energy {checkIn.energyRating}/5 |
                  Training {checkIn.trainingAdherence}%
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(checkIn.id)}
                disabled={deletingId === checkIn.id}
                className="rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-danger)',
                  opacity: deletingId === checkIn.id ? 0.6 : 1,
                }}
              >
                {deletingId === checkIn.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No check-ins found for this client.
        </p>
      )}
    </div>
  );
}
