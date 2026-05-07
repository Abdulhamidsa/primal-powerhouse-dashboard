'use client';

import { X } from 'lucide-react';

interface Props {
  workoutName: string;
  currentIdx: number;
  totalExercises: number;
  completedCount: number;
  onExit: () => void;
}

export default function MobileWorkoutHeader({
  workoutName,
  currentIdx,
  totalExercises,
  completedCount,
  onExit,
}: Props) {
  const progressPercent = Math.round(((currentIdx + 1) / totalExercises) * 100);

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/40">
      {/* Header content */}
      <div className="px-4 pt-3 pb-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{workoutName}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {currentIdx + 1} of {totalExercises} • {completedCount} complete
          </p>
        </div>
        <button
          onClick={onExit}
          className="flex-shrink-0 p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Exit workout"
        >
          <X size={20} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
