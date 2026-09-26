'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { XIcon as X, CheckCircleIcon as CheckCircle } from '@phosphor-icons/react';
import {
  useAdminWorkoutSession,
  useAdminWorkoutSessionActions,
} from '@/features/workout-session/hooks/useAdminWorkoutSessions';

type Props = {
  clientId: string;
  sessionId: string | null;
  onClose: () => void;
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
      {children}
    </p>
  );
}

export function WorkoutSessionReviewDrawer({ clientId, sessionId, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [localReviewed, setLocalReviewed] = useState(new Set<string>());
  const [isMarking, setIsMarking] = useState(false);
  const open = Boolean(sessionId);
  const prevOpenRef = useRef(false);

  const { data: session } = useAdminWorkoutSession(clientId, sessionId ?? null);
  const { markReviewed } = useAdminWorkoutSessionActions(clientId);

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

  if (!mounted || !session) return null;

  const handleMarkReviewed = async () => {
    if (!session || localReviewed.has(session.id)) return;
    try {
      setIsMarking(true);
      await markReviewed(session.id);
      setLocalReviewed(prev => new Set([...Array.from(prev), session.id]));
    } catch {
      // ignore
    } finally {
      setIsMarking(false);
    }
  };

  const isReviewed = localReviewed.has(session.id) || Boolean(session.reviewed);

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
          width: 'min(700px, 100vw)',
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
              Workout Session
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {session.startedAt ? new Date(session.startedAt).toLocaleString() : '—'}
              {session.completedAt ? ` · Completed ${new Date(session.completedAt).toLocaleString()}` : ''}
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
            <SectionHeading>Exercises</SectionHeading>
            <div className="space-y-4">
              {session.exercises.map(ex => (
                <div
                  key={ex.id}
                  className="rounded-xl border p-3"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{ex.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{ex.target ?? ''}</p>
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {ex.completedAt ? new Date(ex.completedAt).toLocaleString() : 'Not completed'}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {ex.sets.map(s => (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-6 text-xs font-mono text-[var(--color-text-secondary)]">{s.setNumber}.</div>
                          <div className="text-[var(--color-text-primary)]">{s.reps ?? '-'} reps</div>
                          <div className="text-[var(--color-text-secondary)]">
                            {s.weightKg != null ? `${s.weightKg} kg` : ''}
                          </div>
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          {s.completed ? 'Done' : 'Missed'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(ex.feedback || ex.feedbackNote) && (
                    <div className="mt-3">
                      <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        Feedback
                      </p>
                      {ex.feedback && (
                        <p className="mb-1 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          Type: {ex.feedback}
                        </p>
                      )}
                      {ex.feedbackNote && (
                        <div
                          className="rounded-lg px-3 py-2.5 text-sm leading-relaxed"
                          style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
                        >
                          {ex.feedbackNote}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {session.notes && (
            <div>
              <SectionHeading>Notes</SectionHeading>
              <div
                className="rounded-lg px-3 py-2.5 text-sm leading-relaxed"
                style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
              >
                {session.notes}
              </div>
            </div>
          )}

          {session.photos && session.photos.length > 0 && (
            <div>
              <SectionHeading>Photos</SectionHeading>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {session.photos.map((p, i) => (
                  <div
                    key={i}
                    className="relative h-40 overflow-hidden rounded-xl border"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <Image src={p} alt={`photo-${i}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="flex flex-shrink-0 items-center justify-end gap-3 border-t px-5 py-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {isReviewed ? (
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
              <CheckCircle size={14} /> Marked as reviewed
            </div>
          ) : (
            <button
              type="button"
              onClick={handleMarkReviewed}
              disabled={isMarking}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                opacity: isMarking ? 0.6 : 1,
              }}
            >
              <CheckCircle size={14} />
              {isMarking ? 'Saving...' : 'Mark as reviewed'}
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
