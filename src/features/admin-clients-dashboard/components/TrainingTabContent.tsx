'use client';

import { useState } from 'react';
import { BarbellIcon as Dumbbell, PlusIcon as Plus, TrashIcon as Trash2, ToggleLeftIcon as ToggleLeft, ToggleRightIcon as ToggleRight, CaretDownIcon as ChevronDown, CaretUpIcon as ChevronUp } from '@phosphor-icons/react';
import { useAdminClientWorkoutSessions } from '@/features/workout-session/hooks/useAdminWorkoutSessions';
import { WorkoutSessionReviewDrawer } from '@/features/workout-session/components/admin/WorkoutSessionReviewDrawer';
import {
  useClientWorkoutAssignments,
  useWorkoutPlans,
  useWorkoutPlanActions,
} from '@/features/workout-plans/hooks/useWorkoutPlans';

interface Props {
  clientId: string;
}

export default function TrainingTabContent({ clientId }: Props) {
  const { assignments, isLoading, mutate } = useClientWorkoutAssignments(clientId);
  const { plans } = useWorkoutPlans();
  const { assign, setAssignmentActive, removeAssignment } = useWorkoutPlanActions();

  const [showPicker, setShowPicker] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data: sessionsResp } = useAdminClientWorkoutSessions(clientId);
  const sessions = sessionsResp?.sessions ?? [];

  async function handleAssign(planId: string) {
    setBusy('assign');
    try {
      await assign({ workoutPlanId: planId, clientId });
      await mutate();
    } finally {
      setBusy(null);
      setShowPicker(false);
    }
  }

  async function handleToggleActive(assignmentId: string, currentActive: boolean) {
    setBusy(assignmentId);
    try {
      await setAssignmentActive(assignmentId, clientId, !currentActive);
      await mutate();
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove(assignmentId: string, planName: string) {
    if (!confirm(`Remove "${planName}" from this client?`)) return;
    setBusy(assignmentId);
    try {
      await removeAssignment(assignmentId, clientId);
      await mutate();
    } finally {
      setBusy(null);
    }
  }

  const unassignedPlans = plans.filter(p => !assignments.some(a => a.workoutPlanId === p.id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Workout Plans</h3>
        {unassignedPlans.length > 0 && (
          <button
            onClick={() => setShowPicker(v => !v)}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg"
            style={{ color: 'var(--color-accent)' }}
          >
            <Plus size={14} />
            Assign plan
          </button>
        )}
      </div>

      {showPicker && (
        <div className="rounded-xl border divide-y overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          {unassignedPlans.map(plan => (
            <button
              key={plan.id}
              disabled={busy === 'assign'}
              onClick={() => handleAssign(plan.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
            >
              <Dumbbell size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{plan.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {plan.exercises.length} exercise{plan.exercises.length !== 1 ? 's' : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 rounded-xl bg-[var(--color-surface)] animate-pulse" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">No workout plans assigned yet.</p>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const isExpanded = expandedId === a.id;
            return (
              <div
                key={a.id}
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                >
                  <Dumbbell
                    size={16}
                    style={{ color: a.isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)', flexShrink: 0 }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {a.workoutPlan.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {a.workoutPlan.exercises.length} exercises · {a.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      disabled={!!busy}
                      onClick={e => {
                        e.stopPropagation();
                        handleToggleActive(a.id, a.isActive);
                      }}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                      title={a.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {a.isActive ? (
                        <ToggleRight size={18} style={{ color: 'var(--color-accent)' }} />
                      ) : (
                        <ToggleLeft size={18} style={{ color: 'var(--color-text-secondary)' }} />
                      )}
                    </button>
                    <button
                      disabled={!!busy}
                      onClick={e => {
                        e.stopPropagation();
                        handleRemove(a.id, a.workoutPlan.name);
                      }}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-50 text-[var(--color-text-secondary)]"
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-[var(--color-text-secondary)]" />
                    ) : (
                      <ChevronDown size={16} className="text-[var(--color-text-secondary)]" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
                    {a.workoutPlan.exercises.map((ex, i) => (
                      <div key={ex.id} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <span className="w-5 text-right shrink-0 font-mono text-xs">{i + 1}.</span>
                        <span className="flex-1 truncate text-[var(--color-text-primary)]">{ex.video.title}</span>
                        <span className="shrink-0 text-xs">
                          {ex.targetSets}×{ex.minReps}–{ex.maxReps} reps
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Completed Sessions</h3>
        </div>

        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">No completed sessions yet.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div
                key={s.id}
                className="rounded-xl border px-3 py-2 flex items-center justify-between"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {s.summary ?? `Session ${s.id}`}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {s.completedAt
                      ? new Date(s.completedAt).toLocaleString()
                      : s.startedAt
                        ? new Date(s.startedAt).toLocaleString()
                        : ''}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => setSelectedSessionId(s.id)}
                    className="rounded-lg px-3 py-1 text-sm font-medium"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <WorkoutSessionReviewDrawer
        clientId={clientId}
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </div>
  );
}
