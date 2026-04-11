'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUserWorkoutAssignments } from '@/features/workout-session/hooks/useUserWorkoutAssignments';
import WorkoutSessionPlayer from '@/features/workout-session/components/WorkoutSessionPlayer';

export default function WorkoutSessionPage() {
  const { planAssignmentId } = useParams<{ planAssignmentId: string }>();
  const { assignments, isLoading } = useUserWorkoutAssignments();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-2xl bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  const assignment = assignments.find(a => a.id === planAssignmentId);

  if (!assignment) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Workout plan not found.</p>
        <button
          className="mt-4 text-sm underline"
          style={{ color: 'var(--color-accent)' }}
          onClick={() => router.push('/user/training')}
        >
          Back to training
        </button>
      </div>
    );
  }

  return <WorkoutSessionPlayer assignment={assignment} onDone={() => router.push('/user/training')} />;
}
