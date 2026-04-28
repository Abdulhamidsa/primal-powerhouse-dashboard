import { useMemo, useState } from 'react';
import { Camera, Eye, Scale, Trash2, RotateCcw, FileText } from 'lucide-react';
import { toDateKeyLocal } from '@/features/daily-checkin/utils/date';
import type {
  AdminClientDailyCheckInsResponse,
  AdminDailyCheckInListItem,
} from '@/features/daily-checkin/types/adminDailyCheckIn.types';
import type {
  AdminClientWeeklyCheckInsResponse,
  AdminWeeklyCheckInListItem,
} from '@/features/weekly-checkin/types/adminWeeklyCheckIn.types';
import { DailyCheckInCard } from '@/features/admin-clients-dashboard/components/DailyCheckInCard';
import { DailyCheckInDetailDrawer } from '@/features/admin-clients-dashboard/components/DailyCheckInDetailDrawer';
import { CheckInCalendarMonth } from '@/features/admin-clients-dashboard/components/CheckInCalendarMonth';
import {
  buildDayStatusMap,
  getSelectedDayData,
  getTodayDateKey,
  nextWeekLocal,
  previousWeekLocal,
  startOfWeekLocal,
} from '@/features/admin-clients-dashboard/lib/checkInCalendar';
import { WeeklyCheckInDetailDrawer } from '@/features/admin-clients-dashboard/components/WeeklyCheckInDetailDrawer';

function getCurrentWeekStyles(status: 'completed' | 'due' | 'overdue') {
  if (status === 'completed') {
    return { bg: 'var(--color-accent-muted)', color: 'var(--color-accent)', label: 'This week: Done' };
  }

  if (status === 'overdue') {
    return {
      bg: 'var(--color-danger-muted, var(--color-bg-alt))',
      color: 'var(--color-danger)',
      label: 'This week: Overdue',
    };
  }

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

  const photoCount = useMemo(
    () =>
      [checkIn.progressPhotoFrontUrl, checkIn.progressPhotoSideUrl, checkIn.progressPhotoBackUrl].filter(Boolean)
        .length,
    [checkIn.progressPhotoBackUrl, checkIn.progressPhotoFrontUrl, checkIn.progressPhotoSideUrl],
  );

  const reflectionCount = useMemo(
    () => [checkIn.strengthUpdate, checkIn.blockerText, checkIn.notes].filter(value => value && value.trim()).length,
    [checkIn.blockerText, checkIn.notes, checkIn.strengthUpdate],
  );

  return (
    <div
      className="space-y-3 rounded-xl border p-4"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Week of {weekLabel}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Submitted {submitLabel}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
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

      <div className="flex flex-wrap gap-2">
        {checkIn.weightKg != null && (
          <StatChip icon={Scale} label="Weight" value={`${checkIn.weightKg.toFixed(1)} kg`} />
        )}
        <StatChip icon={Camera} label="Photos" value={`${photoCount}/3`} />
        <StatChip icon={FileText} label="Reflections" value={`${reflectionCount}`} />
      </div>
    </div>
  );
}

export function CheckInsTabContent({
  weeklyData,
  dailyData,
  isWeeklyLoading,
  isDailyLoading,
  isWeeklyError,
  isDailyError,
  onDeleteWeeklyAction,
  onResetWeeklyAction,
  onMarkDailyReviewedAction,
}: {
  weeklyData: AdminClientWeeklyCheckInsResponse | undefined;
  dailyData: AdminClientDailyCheckInsResponse | undefined;
  isWeeklyLoading: boolean;
  isDailyLoading: boolean;
  isWeeklyError: boolean;
  isDailyError: boolean;
  onDeleteWeeklyAction: (checkInId: string) => Promise<void>;
  onResetWeeklyAction: () => Promise<void>;
  onMarkDailyReviewedAction: (checkInId: string) => Promise<void>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedCheckIn, setSelectedCheckIn] = useState<AdminWeeklyCheckInListItem | null>(null);
  const [selectedDailyCheckIn, setSelectedDailyCheckIn] = useState<AdminDailyCheckInListItem | null>(null);
  const [reviewingDailyId, setReviewingDailyId] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState(getTodayDateKey());
  const [activeWeekDate, setActiveWeekDate] = useState(startOfWeekLocal(new Date()));

  const currentStatus = weeklyData?.currentWeek ? getCurrentWeekStyles(weeklyData.currentWeek.status) : null;
  const clientId = weeklyData?.client.id ?? dailyData?.client.id ?? '';
  const dayStatuses = useMemo(() => buildDayStatusMap(dailyData, weeklyData), [dailyData, weeklyData]);
  const selectedDayData = useMemo(
    () => getSelectedDayData(selectedDateKey, dailyData, weeklyData),
    [selectedDateKey, dailyData, weeklyData],
  );

  const dailySummary = dailyData
    ? {
        submitted: dailyData.summary.submittedCount,
        reviewed: dailyData.summary.reviewedCount,
        averageCompletion: dailyData.summary.averageCompletionPercentage,
        latestSubmittedAt: dailyData.summary.latestSubmittedAt,
      }
    : null;

  const handleDelete = async (checkInId: string) => {
    const confirmed = window.confirm('Delete this weekly check-in entry?');
    if (!confirmed) return;

    try {
      setDeletingId(checkInId);
      await onDeleteWeeklyAction(checkInId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm('Reset all weekly check-ins for this client?');
    if (!confirmed) return;

    try {
      setIsResetting(true);
      await onResetWeeklyAction();
    } finally {
      setIsResetting(false);
    }
  };

  const handleMarkDailyReviewed = async (checkInId: string) => {
    try {
      setReviewingDailyId(checkInId);
      await onMarkDailyReviewedAction(checkInId);
    } finally {
      setReviewingDailyId(null);
    }
  };

  const dailyChecks = dailyData?.checkIns ?? [];
  const weeklyChecks = weeklyData?.checkIns ?? [];
  const selectedDailyChecks = selectedDayData.daily;
  const selectedWeeklyChecks = selectedDayData.weekly;
  const selectedDateLabel = new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const goToPreviousWeek = () => {
    const previousWeekStart = previousWeekLocal(activeWeekDate);
    setActiveWeekDate(previousWeekStart);
    setSelectedDateKey(toDateKeyLocal(previousWeekStart));
  };

  const goToNextWeek = () => {
    const nextWeekStart = nextWeekLocal(activeWeekDate);
    setActiveWeekDate(nextWeekStart);
    setSelectedDateKey(toDateKeyLocal(nextWeekStart));
  };

  return (
    <>
      <div className="space-y-4">
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                Check-In Review Hub
              </h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Daily signals first, weekly recap below.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                disabled={isResetting || !weeklyChecks.length}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{
                  background: 'var(--color-bg-alt)',
                  color: 'var(--color-danger)',
                  opacity: isResetting || !weeklyChecks.length ? 0.6 : 1,
                }}
              >
                <RotateCcw size={12} />
                {isResetting ? 'Resetting...' : 'Reset All'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryStat label="Daily submitted" value={dailySummary ? `${dailySummary.submitted}` : '—'} />
            <SummaryStat label="Daily reviewed" value={dailySummary ? `${dailySummary.reviewed}` : '—'} />
            <SummaryStat label="Avg completion" value={dailySummary ? `${dailySummary.averageCompletion}%` : '—'} />
            <SummaryStat
              label="Latest daily"
              value={
                dailySummary?.latestSubmittedAt
                  ? new Date(dailySummary.latestSubmittedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <CheckInCalendarMonth
            weekStartDate={activeWeekDate}
            selectedDateKey={selectedDateKey}
            dayStatuses={dayStatuses}
            onPreviousWeekAction={goToPreviousWeek}
            onNextWeekAction={goToNextWeek}
            onSelectDateAction={setSelectedDateKey}
          />

          <div className="space-y-4">
            <div
              className="rounded-2xl border p-4"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                  {selectedDateLabel}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const today = getTodayDateKey();
                    setSelectedDateKey(today);
                    setActiveWeekDate(startOfWeekLocal(new Date()));
                  }}
                  className="rounded-lg border px-2.5 py-1 text-xs font-medium"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  Today
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SummaryStat label="Daily entries" value={`${selectedDailyChecks.length}`} />
                <SummaryStat label="Weekly entries" value={`${selectedWeeklyChecks.length}`} />
              </div>
            </div>

            <div
              className="rounded-2xl border p-4"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Daily Check-Ins
                </h4>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {selectedDailyChecks.length ? `${selectedDailyChecks.length} item(s)` : 'No daily entries'}
                </span>
              </div>

              {isDailyLoading ? (
                <div className="space-y-3">
                  {[0, 1].map(i => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-xl"
                      style={{ background: 'var(--color-bg-alt)' }}
                    />
                  ))}
                </div>
              ) : isDailyError ? (
                <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                  Failed to load daily check-ins.
                </p>
              ) : selectedDailyChecks.length ? (
                <div className="space-y-3">
                  {selectedDailyChecks.map(checkIn => (
                    <DailyCheckInCard
                      key={checkIn.id}
                      checkIn={checkIn}
                      onView={() => setSelectedDailyCheckIn(checkIn)}
                      onMarkReviewed={() => handleMarkDailyReviewed(checkIn.id)}
                      isMarkingReviewed={reviewingDailyId === checkIn.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No daily check-ins on this day.
                </p>
              )}
            </div>

            <div
              className="rounded-2xl border p-4"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Weekly Check-Ins
                </h4>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {selectedWeeklyChecks.length ? `${selectedWeeklyChecks.length} item(s)` : 'No weekly entries'}
                </span>
              </div>

              {isWeeklyLoading ? (
                <div className="space-y-3">
                  {[0, 1].map(i => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-xl"
                      style={{ background: 'var(--color-bg-alt)' }}
                    />
                  ))}
                </div>
              ) : isWeeklyError ? (
                <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                  Failed to load weekly check-ins.
                </p>
              ) : selectedWeeklyChecks.length ? (
                <div className="space-y-3">
                  {selectedWeeklyChecks.map(checkIn => (
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
                  No weekly check-ins anchored to this day.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <DailyCheckInDetailDrawer
        checkIn={selectedDailyCheckIn}
        onClose={() => setSelectedDailyCheckIn(null)}
        onMarkReviewed={onMarkDailyReviewedAction}
      />

      <WeeklyCheckInDetailDrawer
        checkIn={selectedCheckIn}
        clientId={clientId}
        onClose={() => setSelectedCheckIn(null)}
      />
    </>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border px-3 py-2"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
      <p className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
    </div>
  );
}
