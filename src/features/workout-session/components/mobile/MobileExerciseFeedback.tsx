'use client';

import { useEffect, useState } from 'react';
import { CaretDownIcon as ChevronDown } from '@phosphor-icons/react';
import type { ExerciseFeedbackType } from '../../types/workoutSession.types';

interface Props {
  feedback: ExerciseFeedbackType | null;
  feedbackNote: string | null;
  currentIdx: number;
  onFeedbackChange: (exerciseIdx: number, feedback: ExerciseFeedbackType | null) => void;
  onFeedbackNoteChange: (exerciseIdx: number, note: string) => void;
  feedbackOptions: { value: ExerciseFeedbackType; label: string }[];
  isTransitioning: boolean;
}

export default function MobileExerciseFeedback({
  feedback,
  feedbackNote,
  currentIdx,
  onFeedbackChange,
  onFeedbackNoteChange,
  feedbackOptions,
  isTransitioning,
}: Props) {
  const [expanded, setExpanded] = useState(Boolean(feedback || feedbackNote));
  const [notesExpanded, setNotesExpanded] = useState(Boolean(feedbackNote));

  useEffect(() => {
    setExpanded(Boolean(feedback || feedbackNote));
    setNotesExpanded(Boolean(feedbackNote));
  }, [currentIdx, feedback, feedbackNote]);

  return (
    <div
      className="px-5 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))] transition-all duration-300 lg:pb-4"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
      }}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(v => !v)}
        className="flex min-h-11 w-full items-center justify-between rounded-2xl bg-muted/40 px-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
      >
        <span>{feedback || feedbackNote ? 'Edit feedback' : 'Add feedback'}</span>
        <ChevronDown
          aria-hidden="true"
          focusable="false"
          size={14}
          className="transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {expanded ? (
        <>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">How did it feel?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {feedbackOptions.map(opt => {
              const isActive = feedback === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => onFeedbackChange(currentIdx, isActive ? null : opt.value)}
                  className="min-h-11 rounded-full border px-4 py-2 text-xs font-medium transition-all active:scale-95"
                  style={{
                    background: isActive ? 'var(--color-accent)' : 'transparent',
                    borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                    color: isActive ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-expanded={notesExpanded}
            onClick={() => setNotesExpanded(v => !v)}
            className="mt-4 flex min-h-11 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {notesExpanded ? 'Hide note' : 'Add a note'}
            <ChevronDown
              aria-hidden="true"
              focusable="false"
              size={14}
              className="transition-transform duration-200"
              style={{ transform: notesExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {notesExpanded && (
            <textarea
              value={feedbackNote ?? ''}
              onChange={e => onFeedbackNoteChange(currentIdx, e.target.value)}
              placeholder="Anything to mention?"
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-transparent bg-muted/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder-muted-foreground focus:border-accent focus:bg-background"
            />
          )}
        </>
      ) : null}
    </div>
  );
}
