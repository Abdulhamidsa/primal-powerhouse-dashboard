'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getDayStatusTone,
  getIsoWeekNumber,
  getTodayDateKey,
  getWeekDays,
  type CheckInDayStatus,
} from '@/features/admin-clients-dashboard/lib/checkInCalendar';
import { toDateKeyLocal } from '@/features/daily-checkin/utils/date';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = {
  weekStartDate: Date;
  selectedDateKey: string;
  dayStatuses: Record<string, CheckInDayStatus>;
  onPreviousWeekAction: () => void;
  onNextWeekAction: () => void;
  onSelectDateAction: (dateKey: string) => void;
};

function DayMarker({ status, label }: { status: 'none' | 'pending' | 'reviewed'; label: string }) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)' }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: getDayStatusTone(status) }} />
      <span>{label}</span>
    </div>
  );
}

export function CheckInCalendarMonth({
  weekStartDate,
  selectedDateKey,
  dayStatuses,
  onPreviousWeekAction,
  onNextWeekAction,
  onSelectDateAction,
}: Props) {
  const weekDays = getWeekDays(weekStartDate);
  const weekNumber = getIsoWeekNumber(weekStartDate);
  const weekStartLabel = weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const weekEndLabel = weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const todayDateKey = getTodayDateKey();

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPreviousWeekAction}
          className="inline-flex items-center justify-center rounded-lg border p-2"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          aria-label="Previous week"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Week {weekNumber}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {weekStartLabel} - {weekEndLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={onNextWeekAction}
          className="inline-flex items-center justify-center rounded-lg border p-2"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          aria-label="Next week"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mb-3 grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map(label => (
          <div key={label} className="text-center text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map(day => {
          const dayDateKey = toDateKeyLocal(day);
          const dayStatus = dayStatuses[dayDateKey] ?? { daily: 'none', weekly: 'none' };
          const isSelected = dayDateKey === selectedDateKey;
          const isToday = dayDateKey === todayDateKey;

          return (
            <button
              key={dayDateKey}
              type="button"
              onClick={() => onSelectDateAction(dayDateKey)}
              className="min-h-[78px] rounded-xl border px-1.5 py-1 text-left"
              style={{
                borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                background: isSelected ? 'var(--color-accent-muted)' : 'var(--color-bg-alt)',
              }}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                  {day.getDate()}
                </span>
                {isToday ? (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ background: 'var(--color-accent)', color: '#fff' }}
                  >
                    Today
                  </span>
                ) : null}
              </div>

              <div className="space-y-1">
                <DayMarker status={dayStatus.daily} label="Daily" />
                <DayMarker status={dayStatus.weekly} label="Weekly" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <LegendItem color="#16a34a" label="Reviewed" />
        <LegendItem color="#ea580c" label="Pending" />
        <LegendItem color="#9ca3af" label="No entry" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
      style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)' }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
