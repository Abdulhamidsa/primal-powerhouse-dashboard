'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Scale, Ruler, Zap, Dumbbell, Utensils, Moon, Flame, Apple, Activity, CheckCircle } from 'lucide-react';
import { markAdminWeeklyCheckInReviewed } from '@/features/weekly-checkin/api/adminWeeklyCheckIn.api';
import type { AdminWeeklyCheckInListItem } from '@/features/weekly-checkin/types/adminWeeklyCheckIn.types';

const SCALE_LABEL: Record<number, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very high',
};

function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2 flex-1">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: 6, background: 'var(--color-border)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'var(--color-accent)' }}
        />
      </div>
      <span className="text-xs font-medium w-14 text-right" style={{ color: 'var(--color-text)' }}>
        {SCALE_LABEL[value] ?? value}
      </span>
    </div>
  );
}

function AdherenceBar({ value }: { value: number }) {
  const color = value >= 80 ? 'var(--color-accent)' : value >= 50 ? '#f59e0b' : 'var(--color-danger, #ef4444)';
  return (
    <div className="flex items-center gap-2 flex-1">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: 6, background: 'var(--color-border)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold w-10 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-wide mb-3"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {children}
    </p>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'var(--color-bg-alt)' }}
      >
        <Icon size={14} style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs w-28 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
        {children}
      </div>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p
        className="rounded-lg px-3 py-2.5 text-sm leading-relaxed"
        style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
      >
        {value}
      </p>
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

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Unmount after close animation
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
      // silently ignore — review is best-effort
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
  const hasNotes = checkIn.strengthUpdate || checkIn.blockerText || checkIn.notes;

  return (
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-50"
      style={{ pointerEvents: open ? 'auto' : 'none', opacity: open ? 1 : 0, transition: 'opacity 200ms' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="absolute right-0 top-0 h-full flex flex-col"
        style={{
          width: 'min(480px, 100vw)',
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 210ms ease-out',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Weekly Review
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Body metrics */}
          <div>
            <SectionHeading>Body Metrics</SectionHeading>
            <div className="space-y-2.5">
              {checkIn.weightKg != null && (
                <Row icon={Scale} label="Weight">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {checkIn.weightKg.toFixed(1)} kg
                  </span>
                </Row>
              )}
              {checkIn.waistCm != null && (
                <Row icon={Ruler} label="Waist">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {checkIn.waistCm.toFixed(1)} cm
                  </span>
                </Row>
              )}
              {checkIn.weightKg == null && checkIn.waistCm == null && (
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No body metrics logged.</p>
              )}
            </div>
          </div>

          {/* Adherence */}
          <div>
            <SectionHeading>Adherence</SectionHeading>
            <div className="space-y-2.5">
              <Row icon={Dumbbell} label="Training">
                <AdherenceBar value={checkIn.trainingAdherence} />
              </Row>
              <Row icon={Utensils} label="Nutrition">
                <AdherenceBar value={checkIn.nutritionAdherence} />
              </Row>
            </div>
          </div>

          {/* Recovery */}
          <div>
            <SectionHeading>Recovery & Biofeedback</SectionHeading>
            <div className="space-y-2.5">
              <Row icon={Zap} label="Energy">
                <ScoreBar value={checkIn.energyRating} />
              </Row>
              {checkIn.stressRating != null && (
                <Row icon={Activity} label="Stress">
                  <ScoreBar value={checkIn.stressRating} />
                </Row>
              )}
              {checkIn.hungerRating != null && (
                <Row icon={Apple} label="Hunger">
                  <ScoreBar value={checkIn.hungerRating} />
                </Row>
              )}
              {checkIn.digestionRating != null && (
                <Row icon={Flame} label="Digestion">
                  <ScoreBar value={checkIn.digestionRating} />
                </Row>
              )}
              {checkIn.sleepHours != null && (
                <Row icon={Moon} label="Sleep">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {checkIn.sleepHours.toFixed(1)} hrs
                  </span>
                </Row>
              )}
            </div>
          </div>

          {/* Text fields */}
          {hasNotes && (
            <div>
              <SectionHeading>Notes & Reflection</SectionHeading>
              <div className="space-y-3">
                <TextBlock label="Strength update" value={checkIn.strengthUpdate} />
                <TextBlock label="Main blocker" value={checkIn.blockerText} />
                <TextBlock label="Notes" value={checkIn.notes} />
              </div>
            </div>
          )}
        </div>

        {/* Footer: mark reviewed */}
        <div
          className="flex items-center justify-end gap-3 px-5 py-4 border-t flex-shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {isReviewed ? (
            <div
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
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
