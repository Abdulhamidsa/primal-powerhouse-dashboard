'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircleIcon as CheckCircle, ClockIcon as Clock3, BarbellIcon as Dumbbell, FileTextIcon as FileText, BowlFoodIcon as Salad, XIcon as X } from '@phosphor-icons/react';
import type { AdminDailyCheckInListItem } from '@/features/daily-checkin/types/adminDailyCheckIn.types';
import { formatShortDateLabel } from '@/features/daily-checkin/utils/date';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
      {children}
    </p>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
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

function TextBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p
        className="rounded-lg px-3 py-2.5 text-sm leading-relaxed"
        style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'good' | 'warn' | 'neutral' }) {
  const background =
    tone === 'good'
      ? 'var(--color-accent-muted)'
      : tone === 'warn'
        ? 'rgba(245, 158, 11, 0.12)'
        : 'var(--color-bg-alt)';
  const color = tone === 'good' ? 'var(--color-accent)' : tone === 'warn' ? '#b45309' : 'var(--color-text-muted)';

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background, color }}
    >
      {label}
    </span>
  );
}

type Props = {
  checkIn: AdminDailyCheckInListItem | null;
  onClose: () => void;
  onMarkReviewed: (checkInId: string) => Promise<void>;
};

export function DailyCheckInDetailDrawer({ checkIn, onClose, onMarkReviewed }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);
  const open = checkIn !== null;
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (prevOpenRef.current && !open) {
      const timeout = window.setTimeout(() => setMounted(false), 220);
      return () => window.clearTimeout(timeout);
    }

    prevOpenRef.current = open;
  }, [open]);

  const handleMarkReviewed = async () => {
    if (!checkIn || checkIn.reviewed) return;

    try {
      setIsMarkingReviewed(true);
      await onMarkReviewed(checkIn.id);
    } finally {
      setIsMarkingReviewed(false);
    }
  };

  if (!mounted || !checkIn) return null;

  const dayLabel = formatShortDateLabel(checkIn.dayDate);
  const submittedLabel = new Date(checkIn.submittedAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-50"
      style={{ pointerEvents: open ? 'auto' : 'none', opacity: open ? 1 : 0, transition: 'opacity 200ms' }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />

      <div
        className="absolute right-0 top-0 flex h-full flex-col"
        style={{
          width: 'min(560px, 100vw)',
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 210ms ease-out',
        }}
      >
        <div
          className="flex flex-shrink-0 items-start justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Daily Review
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {dayLabel} · submitted {submittedLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X aria-hidden="true" focusable="false" size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetricPill label="Completion" value={`${checkIn.completionPercentage}%`} />
            <MetricPill label="Status" value={checkIn.reviewed ? 'Reviewed' : 'Needs review'} />
          </div>

          <div>
            <SectionHeading>Body Signals</SectionHeading>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MetricPill
                label="Weight"
                value={checkIn.weightKg != null ? `${checkIn.weightKg.toFixed(1)} kg` : 'Not submitted'}
              />
              <MetricPill label="Energy" value={checkIn.energy ?? 'Not submitted'} />
              <MetricPill label="Hunger" value={checkIn.hunger ?? 'Not submitted'} />
              <MetricPill label="Sleep" value={checkIn.sleep ?? 'Not submitted'} />
            </div>
          </div>

          <div>
            <SectionHeading>Compliance</SectionHeading>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
              >
                <Salad aria-hidden="true" focusable="false" size={14} style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <p className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                    Nutrition
                  </p>
                  <StatusPill
                    label={checkIn.nutritionStatus ?? 'Not logged'}
                    tone={
                      checkIn.nutritionStatus === 'ON_PLAN'
                        ? 'good'
                        : checkIn.nutritionStatus === 'PARTIAL'
                          ? 'warn'
                          : 'neutral'
                    }
                  />
                </div>
              </div>
              <div
                className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
              >
                <Dumbbell aria-hidden="true" focusable="false" size={14} style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <p className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                    Training
                  </p>
                  <StatusPill
                    label={checkIn.trainingStatus ?? 'Not logged'}
                    tone={
                      checkIn.trainingStatus === 'DONE'
                        ? 'good'
                        : checkIn.trainingStatus === 'PARTIAL'
                          ? 'warn'
                          : 'neutral'
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeading>
              <span className="inline-flex items-center gap-1.5">
                <FileText aria-hidden="true" focusable="false" size={12} /> Coach Note
              </span>
            </SectionHeading>
            <TextBlock label="Note" value={checkIn.note} />
            {!checkIn.note ? (
              <div
                className="flex items-center gap-2 rounded-xl border border-dashed px-3 py-3"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                <Clock3 aria-hidden="true" focusable="false" size={14} />
                <span className="text-sm">No note was added for this day.</span>
              </div>
            ) : null}
          </div>
        </div>

        <div
          className="flex flex-shrink-0 items-center justify-end gap-3 border-t px-5 py-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {checkIn.reviewed ? (
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
              <CheckCircle aria-hidden="true" focusable="false" size={14} />
              Marked as reviewed
            </div>
          ) : (
            <button
              type="button"
              onClick={handleMarkReviewed}
              disabled={isMarkingReviewed}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                opacity: isMarkingReviewed ? 0.6 : 1,
              }}
            >
              <CheckCircle aria-hidden="true" focusable="false" size={14} />
              {isMarkingReviewed ? 'Saving...' : 'Mark as reviewed'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
