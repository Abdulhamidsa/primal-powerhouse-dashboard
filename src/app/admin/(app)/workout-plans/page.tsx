'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useWorkoutPlans } from '@/features/workout-plans/hooks/useWorkoutPlans';
import WorkoutPlanCard from '@/features/workout-plans/components/WorkoutPlanCard';
import WorkoutPlanFormModal from '@/features/workout-plans/components/WorkoutPlanFormModal';
import type { WorkoutPlan } from '@/features/workout-plans/types/workoutPlan.types';

export default function WorkoutPlansPage() {
  const { plans, isLoading, mutate } = useWorkoutPlans();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Workout Plans</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Create and manage workout plans for your clients
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          <Plus size={16} />
          New Plan
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-[var(--color-surface)] animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[var(--color-text-secondary)] text-base">No workout plans yet.</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 text-sm underline"
            style={{ color: 'var(--color-accent)' }}
          >
            Create your first plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map(plan => (
            <WorkoutPlanCard key={plan.id} plan={plan} onEdit={() => setEditingPlan(plan)} onMutate={mutate} />
          ))}
        </div>
      )}

      {isCreateOpen && (
        <WorkoutPlanFormModal
          onClose={() => setIsCreateOpen(false)}
          onSaved={() => {
            setIsCreateOpen(false);
            void mutate();
          }}
        />
      )}

      {editingPlan && (
        <WorkoutPlanFormModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSaved={() => {
            setEditingPlan(null);
            void mutate();
          }}
        />
      )}
    </div>
  );
}
