'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { XIcon as X, ScalesIcon as Scale, CameraIcon as Camera, FileTextIcon as FileText, CheckCircleIcon as CheckCircle } from '@phosphor-icons/react';
import { markAdminWeeklyCheckInReviewed } from '@/features/weekly-checkin/api/adminWeeklyCheckIn.api';
import type { AdminWeeklyCheckInListItem } from '@/features/weekly-checkin/types/adminWeeklyCheckIn.types';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
      {children}
    </p>
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

function PhotoCard({ label, src }: { label: string; src: string | null }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      {src ? (
        <div className="relative h-40 overflow-hidden rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <Image src={src} alt={`${label} progress`} fill className="object-cover" />
        </div>
      ) : (
        <div
          className="flex h-40 items-center justify-center rounded-xl border border-dashed"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Not uploaded
          </span>
        </div>
      )}
    </div>
  );
}

type Props = {
  checkIn: AdminWeeklyCheckInListItem | null;
  clientId: string;
  onClose: () => void;
};

export function WeeklyCheckInDetailDrawer({ checkIn, clientId, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const open = checkIn !== null;
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
    prevOpenRef.current = open;
  }, [open]);

  const handleMarkReviewed = async () => {
    if (!checkIn || reviewedIds.has(checkIn.id)) return;

    try {
      setIsMarkingReviewed(true);
      await markAdminWeeklyCheckInReviewed(clientId, checkIn.id);
      setReviewedIds(prev => new Set([...prev, checkIn.id]));
    } catch {
      // Best effort action; keep UI usable even if request fails.
    } finally {
      setIsMarkingReviewed(false);
    }
  };

  if (!mounted || !checkIn) return null;

  const weekLabel = new Date(`${checkIn.weekStartDate}T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isReviewed = reviewedIds.has(checkIn.id);

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
              Weekly Review
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Week of {weekLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div>
            <SectionHeading>Body Metric</SectionHeading>
            <div
              className="rounded-xl border p-3"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
            >
              <div className="flex items-center gap-2">
                <Scale size={14} style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Weight
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {checkIn.weightKg != null ? `${checkIn.weightKg.toFixed(1)} kg` : 'Not submitted'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <SectionHeading>
              <span className="inline-flex items-center gap-1.5">
                <Camera size={12} /> Progress Photos
              </span>
            </SectionHeading>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <PhotoCard label="Front" src={checkIn.progressPhotoFrontUrl} />
              <PhotoCard label="Side" src={checkIn.progressPhotoSideUrl} />
              <PhotoCard label="Back" src={checkIn.progressPhotoBackUrl} />
            </div>
          </div>

          <div>
            <SectionHeading>
              <span className="inline-flex items-center gap-1.5">
                <FileText size={12} /> Reflection
              </span>
            </SectionHeading>
            <div className="space-y-3">
              <TextBlock label="Strength update" value={checkIn.strengthUpdate} />
              <TextBlock label="Main blocker" value={checkIn.blockerText} />
              <TextBlock label="Notes" value={checkIn.notes} />
            </div>
          </div>
        </div>

        <div
          className="flex flex-shrink-0 items-center justify-end gap-3 border-t px-5 py-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {isReviewed ? (
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
              <CheckCircle size={14} />
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
              <CheckCircle size={14} />
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
