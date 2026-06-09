'use client';

import { useMemo } from 'react';
import { CheckCircle, Eye, Scale } from 'lucide-react';
import type { AdminDailyCheckInListItem } from '@/features/daily-checkin/types/adminDailyCheckIn.types';
import { formatShortDateLabel } from '@/features/daily-checkin/utils/date';

function InfoChip({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'neutral';
}) {
  const background =
    tone === 'good'
      ? 'var(--color-accent-muted)'
      : tone === 'warn'
        ? 'rgba(245, 158, 11, 0.12)'
        : 'var(--color-surface)';
  const color = tone === 'good' ? 'var(--color-accent)' : tone === 'warn' ? '#b45309' : 'var(--color-text)';

  return (
    <div
      className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs"
      style={{ borderColor: 'var(--color-border)', background, color }}
    >
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: 'good' | 'warn' | 'neutral' }) {
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
  checkIn: AdminDailyCheckInListItem;
  onViewAction: () => void;
  onMarkReviewedAction: () => Promise<void>;
  isMarkingReviewed: boolean;
};

export function DailyCheckInCard({ checkIn, onViewAction, onMarkReviewedAction, isMarkingReviewed }: Props) {
  const dayLabel = formatShortDateLabel(checkIn.dayDate);
  const submittedLabel = new Date(checkIn.submittedAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const notePreview = useMemo(() => {
    if (!checkIn.note) return null;
    return checkIn.note.length > 110 ? `${checkIn.note.slice(0, 110).trim()}…` : checkIn.note;
  }, [checkIn.note]);

  return (
    <div
      className="space-y-3 rounded-xl border p-4"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {dayLabel}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Submitted {submittedLabel}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <StatusBadge
            label={checkIn.reviewed ? 'Reviewed' : 'Needs review'}
            tone={checkIn.reviewed ? 'good' : 'warn'}
          />
          <StatusBadge label={`${checkIn.completionPercentage}%`} tone={checkIn.isComplete ? 'good' : 'neutral'} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <InfoChip
          label="Weight"
          value={checkIn.weightKg != null ? `${checkIn.weightKg.toFixed(1)} kg` : '—'}
          tone={checkIn.weightKg != null ? 'good' : 'neutral'}
        />
        <InfoChip label="Energy" value={checkIn.energy ?? '—'} tone={checkIn.energy ? 'good' : 'neutral'} />
        <InfoChip label="Hunger" value={checkIn.hunger ?? '—'} tone={checkIn.hunger ? 'good' : 'neutral'} />
        <InfoChip label="Sleep" value={checkIn.sleep ?? '—'} tone={checkIn.sleep ? 'good' : 'neutral'} />
        <InfoChip
          label="Nutrition"
          value={checkIn.nutritionStatus ?? '—'}
          tone={
            checkIn.nutritionStatus === 'ON_PLAN' ? 'good' : checkIn.nutritionStatus === 'PARTIAL' ? 'warn' : 'neutral'
          }
        />
        <InfoChip
          label="Training"
          value={checkIn.trainingStatus ?? '—'}
          tone={checkIn.trainingStatus === 'DONE' ? 'good' : checkIn.trainingStatus === 'PARTIAL' ? 'warn' : 'neutral'}
        />
      </div>

      {notePreview ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Note
          </p>
          <p
            className="rounded-lg px-3 py-2.5 text-sm leading-relaxed"
            style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            {notePreview}
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <Scale size={12} />
          <span>{checkIn.reviewed ? 'Ready for follow-up' : 'Open for coach review'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onViewAction}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            <Eye size={12} />
            View
          </button>
          {!checkIn.reviewed ? (
            <button
              type="button"
              onClick={onMarkReviewedAction}
              disabled={isMarkingReviewed}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                opacity: isMarkingReviewed ? 0.6 : 1,
              }}
            >
              <CheckCircle size={12} />
              {isMarkingReviewed ? '...' : 'Review'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
