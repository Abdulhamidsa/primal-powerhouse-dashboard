'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
  const [notesExpanded, setNotesExpanded] = useState(Boolean(feedbackNote));

  return (
    <div
      className="px-5 pt-5 pb-4 transition-all duration-300"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
      }}
    >
      <h3 className="text-sm font-semibold text-foreground mb-3">How did it feel?</h3>

      {/* Feedback chips */}
      <div className="flex flex-wrap gap-2">
        {feedbackOptions.map((opt) => {
          const isActive = feedback === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onFeedbackChange(currentIdx, isActive ? null : opt.value)}
              className="px-4 py-2 rounded-full text-xs font-medium border transition-all active:scale-95"
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

      {/* Notes (collapsible) */}
      <button
        onClick={() => setNotesExpanded((v) => !v)}
        className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Add a note
        <ChevronDown
          size={14}
          className="transition-transform duration-200"
          style={{ transform: notesExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {notesExpanded && (
        <textarea
          value={feedbackNote ?? ''}
          onChange={(e) => onFeedbackNoteChange(currentIdx, e.target.value)}
          placeholder="Anything to mention?"
          rows={3}
          className="mt-2 w-full px-3 py-2.5 rounded-xl bg-muted/60 text-sm text-foreground placeholder-muted-foreground border border-transparent focus:border-accent focus:bg-background outline-none resize-none transition-colors"
        />
      )}
    </div>
  );
}
