import { useState } from 'react';
import { Scale, Ruler, Zap, Dumbbell, Utensils, Eye, Trash2, RotateCcw } from 'lucide-react';
import type {
  AdminClientWeeklyCheckInsResponse,
  AdminWeeklyCheckInListItem,
} from '@/features/weekly-checkin/types/adminWeeklyCheckIn.types';
import { WeeklyCheckInDetailDrawer } from '@/features/admin-clients-dashboard/components/WeeklyCheckInDetailDrawer';

const SCALE_LABEL: Record<number, string> = { 1: 'Very low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very high' };

function getCurrentWeekStyles(status: 'completed' | 'due' | 'overdue') {
  if (status === 'completed')
    return { bg: 'var(--color-accent-muted)', color: 'var(--color-accent)', label: 'This week: Done' };
  if (status === 'overdue')
    return {
      bg: 'var(--color-danger-muted, var(--color-bg-alt))',
      color: 'var(--color-danger)',
      label: 'This week: Overdue',
    };
  return { bg: 'var(--color-bg-alt)', color: 'var(--color-text-muted)', label: 'This week: Pending' };
}

function StatChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <Icon size={11} style={{ color: 'var(--color-text-muted)' }} />
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
        {value}
      </span>
    </div>
  );
}

function CheckInCard({
  checkIn,
  onView,
  onDelete,
  isDeleting,
}: {
  checkIn: AdminWeeklyCheckInListItem;
  onView: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const weekLabel = new Date(`${checkIn.weekStartDate}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const submitLabel = new Date(checkIn.submittedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Week of {weekLabel}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Submitted {submitLabel}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onView}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            <Eye size={12} />
            View
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-danger)',
              opacity: isDeleting ? 0.5 : 1,
            }}
          >
            <Trash2 size={12} />
            {isDeleting ? '...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2">
        <StatChip icon={Zap} label="Energy" value={`${SCALE_LABEL[checkIn.energyRating] ?? checkIn.energyRating}`} />
        <StatChip icon={Dumbbell} label="Training" value={`${checkIn.trainingAdherence}%`} />
        <StatChip icon={Utensils} label="Nutrition" value={`${checkIn.nutritionAdherence}%`} />
        {checkIn.weightKg != null && (
          <StatChip icon={Scale} label="Weight" value={`${checkIn.weightKg.toFixed(1)} kg`} />
        )}
        {checkIn.waistCm != null && <StatChip icon={Ruler} label="Waist" value={`${checkIn.waistCm.toFixed(1)} cm`} />}
      </div>
    </div>
  );
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
  const [selectedCheckIn, setSelectedCheckIn] = useState<AdminWeeklyCheckInListItem | null>(null);

  const currentStatus = data?.currentWeek ? getCurrentWeekStyles(data.currentWeek.status) : null;
  const clientId = data?.client.id ?? '';

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
    <>
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Weekly Check-Ins
          </h3>
          <div className="flex items-center gap-2">
            {currentStatus && (
              <span
                className="rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ background: currentStatus.bg, color: currentStatus.color }}
              >
                {currentStatus.label}
              </span>
            )}
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting || !data?.checkIns.length}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-danger)',
                opacity: isResetting || !data?.checkIns.length ? 0.6 : 1,
              }}
            >
              <RotateCcw size={12} />
              {isResetting ? 'Resetting...' : 'Reset All'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-24 animate-pulse rounded-xl" style={{ background: 'var(--color-bg-alt)' }} />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
            Failed to load weekly check-ins.
          </p>
        ) : data?.checkIns.length ? (
          <div className="space-y-3">
            {data.checkIns.map(checkIn => (
              <CheckInCard
                key={checkIn.id}
                checkIn={checkIn}
                onView={() => setSelectedCheckIn(checkIn)}
                onDelete={() => handleDelete(checkIn.id)}
                isDeleting={deletingId === checkIn.id}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No check-ins found for this client.
          </p>
        )}
      </div>

      <WeeklyCheckInDetailDrawer
        checkIn={selectedCheckIn}
        clientId={clientId}
        onClose={() => setSelectedCheckIn(null)}
      />
    </>
  );
}
