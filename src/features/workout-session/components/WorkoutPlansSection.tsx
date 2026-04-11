'use client';

import Link from 'next/link';
import { Dumbbell, ChevronRight } from 'lucide-react';
import { useUserWorkoutAssignments } from '@/features/workout-session/hooks/useUserWorkoutAssignments';

export default function WorkoutPlansSection() {
  const { assignments, isLoading } = useUserWorkoutAssignments();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No workout plans assigned yet. Your coach will add one soon.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map(a => (
        <Link
          key={a.id}
          href={`/user/workout/${encodeURIComponent(a.id)}`}
          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:bg-card/80 transition-colors"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-accent-muted)' }}
          >
            <Dumbbell size={18} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{a.workoutPlan.name}</p>
            <p className="text-sm text-muted-foreground">
              {a.workoutPlan.exercises.length} exercise{a.workoutPlan.exercises.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground shrink-0" />
        </Link>
      ))}
    </div>
  );
}
