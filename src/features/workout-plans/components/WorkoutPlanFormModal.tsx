'use client';

import { useState } from 'react';
import { XIcon as X, PlusIcon as Plus, TrashIcon as Trash2, DotsSixVerticalIcon as GripVertical, MagnifyingGlassIcon as Search } from '@phosphor-icons/react';
import { useWorkoutPlanActions } from '../hooks/useWorkoutPlans';
import type { WorkoutPlan } from '../types/workoutPlan.types';
import type { ExerciseDbExercise } from '@/features/exercises/types/exerciseDb.types';
import { useRapidAPIExercises } from '@/features/exercises/hooks/useRapidAPIExercises';
import { useRapidAPIFilterOptions } from '@/features/exercises/hooks/useRapidAPIFilterOptions';
import ExerciseFilters from '@/features/exercises/components/ExerciseFilters';
import Image from 'next/image';

interface ExerciseRow {
  videoId: string;
  videoTitle: string;
  gifUrl?: string | null;
  targetSets: number;
  minReps: number;
  maxReps: number;
  suggestedWeightKg: number | null;
  restSeconds: number;
  notes: string;
}

interface Props {
  plan?: WorkoutPlan | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function WorkoutPlanFormModal({ plan, onClose, onSaved }: Props) {
  const { create, update } = useWorkoutPlanActions();
  const filterOptions = useRapidAPIFilterOptions();
  const {
    exercises: exerciseDbResults,
    isLoading: isLoadingExercises,
    query: videoSearch,
    setQuery: setVideoSearch,
    filters,
    updateFilters,
    clearFilters,
    hasMore,
    loadMore,
  } = useRapidAPIExercises();

  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [exercises, setExercises] = useState<ExerciseRow[]>(
    plan?.exercises.map(ex => ({
      videoId: ex.videoId,
      videoTitle: ex.video.title,
      gifUrl: ex.video.thumbnailUrl ?? null,
      targetSets: ex.targetSets,
      minReps: ex.minReps,
      maxReps: ex.maxReps,
      suggestedWeightKg: ex.suggestedWeightKg,
      restSeconds: ex.restSeconds,
      notes: ex.notes ?? '',
    })) ?? [],
  );

  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addExercise(exercise: ExerciseDbExercise) {
    setExercises(prev => [
      ...prev,
      {
        videoId: exercise.exerciseId,
        videoTitle: exercise.name,
        gifUrl: exercise.gifUrl ?? null,
        targetSets: 3,
        minReps: 8,
        maxReps: 12,
        suggestedWeightKg: null,
        restSeconds: 120,
        notes: '',
      },
    ]);
    setShowVideoPicker(false);
    setVideoSearch('');
    clearFilters();
  }

  function removeExercise(idx: number) {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  }

  function updateExercise<K extends keyof ExerciseRow>(idx: number, key: K, value: ExerciseRow[K]) {
    setExercises(prev => prev.map((ex, i) => (i === idx ? { ...ex, [key]: value } : ex)));
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Plan name is required.');
      return;
    }
    if (exercises.length === 0) {
      setError('Add at least one exercise.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        exercises: exercises.map(ex => ({
          videoId: ex.videoId,
          videoTitle: ex.videoTitle,
          gifUrl: ex.gifUrl ?? undefined,
          targetSets: ex.targetSets,
          minReps: ex.minReps,
          maxReps: ex.maxReps,
          suggestedWeightKg: ex.suggestedWeightKg,
          restSeconds: ex.restSeconds,
          notes: ex.notes || null,
        })),
      };
      if (plan) {
        await update(plan.id, payload);
      } else {
        await create(payload);
      }
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {plan ? 'Edit Workout Plan' : 'New Workout Plan'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)]">
            <X size={18} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 flex-1">
          {error && <p className="text-sm px-3 py-2 rounded-lg bg-red-500/10 text-red-400">{error}</p>}

          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Plan Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Upper Body Strength A"
              className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent text-[var(--color-text-primary)]"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of the plan"
              className="w-full px-3 py-2 rounded-lg text-sm border bg-transparent text-[var(--color-text-primary)] resize-none"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>

          {/* Exercise list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                Exercises ({exercises.length})
              </span>
              <button
                type="button"
                onClick={() => setShowVideoPicker(true)}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg"
                style={{ color: 'var(--color-accent)' }}
              >
                <Plus size={14} />
                Add exercise
              </button>
            </div>

            {exercises.length === 0 && (
              <p className="text-sm text-[var(--color-text-secondary)] py-4 text-center">
                No exercises yet. Add one above.
              </p>
            )}

            {exercises.map((ex, idx) => (
              <div
                key={`${ex.videoId}-${idx}`}
                className="rounded-xl border p-4 space-y-3"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <GripVertical size={16} className="text-[var(--color-text-secondary)] shrink-0" />
                    <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {idx + 1}. {ex.videoTitle}
                    </span>
                  </div>
                  <button
                    onClick={() => removeExercise(idx)}
                    className="shrink-0 p-1 rounded text-[var(--color-text-secondary)]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(
                    [
                      { label: 'Sets', key: 'targetSets', min: 1, max: 20 },
                      { label: 'Min reps', key: 'minReps', min: 1, max: 100 },
                      { label: 'Max reps', key: 'maxReps', min: 1, max: 100 },
                      { label: 'Rest (s)', key: 'restSeconds', min: 0, max: 600 },
                    ] as const
                  ).map(({ label, key, min, max }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs text-[var(--color-text-secondary)]">{label}</label>
                      <input
                        type="number"
                        min={min}
                        max={max}
                        value={(ex as any)[key]}
                        onChange={e => updateExercise(idx, key, Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg text-sm border bg-transparent text-[var(--color-text-primary)]"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--color-text-secondary)]">Suggested weight (kg)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="Optional"
                      value={ex.suggestedWeightKg ?? ''}
                      onChange={e =>
                        updateExercise(idx, 'suggestedWeightKg', e.target.value === '' ? null : Number(e.target.value))
                      }
                      className="w-full px-2 py-1.5 rounded-lg text-sm border bg-transparent text-[var(--color-text-primary)]"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--color-text-secondary)]">Coach notes</label>
                    <input
                      type="text"
                      placeholder="Optional note"
                      value={ex.notes}
                      onChange={e => updateExercise(idx, 'notes', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-sm border bg-transparent text-[var(--color-text-primary)]"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border text-[var(--color-text-primary)]"
            style={{ borderColor: 'var(--color-border)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: 'var(--color-accent)' }}
          >
            {saving ? 'Saving…' : plan ? 'Save changes' : 'Create plan'}
          </button>
        </div>
      </div>

      {/* Video picker overlay */}
      {showVideoPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl flex flex-col bg-card">
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <h3 className="font-semibold text-[var(--color-text-primary)]">Pick an exercise</h3>
              <button onClick={() => setShowVideoPicker(false)}>
                <X size={18} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>

            {/* Search input */}
            <div className="p-3 border-b space-y-3" style={{ borderColor: 'var(--color-border)' }}>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Search size={14} style={{ color: 'var(--color-text-secondary)' }} />
                <input
                  autoFocus
                  value={videoSearch}
                  onChange={e => setVideoSearch(e.target.value)}
                  placeholder="Search exercises… (e.g., bench, squat)"
                  className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none"
                />
              </div>

              {/* Filters */}
              <ExerciseFilters
                bodyParts={filterOptions.bodyParts}
                equipments={filterOptions.equipments}
                targetMuscles={filterOptions.targetMuscles}
                difficulties={filterOptions.difficulties}
                selectedFilters={filters}
                onFilterChange={updateFilters}
                onClear={clearFilters}
              />
            </div>

            {/* Results */}
            <div className="overflow-y-auto flex-1 divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {isLoadingExercises && exerciseDbResults.length === 0 ? (
                <p className="p-4 text-sm text-[var(--color-text-secondary)] text-center">Loading exercises…</p>
              ) : exerciseDbResults.length === 0 ? (
                <p className="p-4 text-sm text-[var(--color-text-secondary)] text-center">No exercises found.</p>
              ) : (
                exerciseDbResults.map((ex, idx) => (
                  <button
                    key={`${ex.exerciseId}-${idx}`}
                    onClick={() => addExercise(ex)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface-hover)]"
                  >
                    {ex.gifUrl ? (
                      <Image
                        src={ex.gifUrl}
                        alt={ex.name}
                        width={40}
                        height={40}
                        unoptimized
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-[var(--color-surface)] shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-text-primary)] truncate font-medium">{ex.name}</p>
                      {(ex.target || ex.targetMuscles?.length) && (
                        <p className="text-xs text-[var(--color-text-secondary)] truncate">
                          {ex.target
                            ? typeof ex.target === 'string'
                              ? ex.target
                              : Array.isArray(ex.target)
                                ? ex.target.slice(0, 2).join(', ')
                                : ''
                            : ex.targetMuscles?.slice(0, 2).join(', ')}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Load more button */}
            {hasMore && exerciseDbResults.length > 0 && (
              <div className="border-t p-3" style={{ borderColor: 'var(--color-border)' }}>
                <button
                  onClick={loadMore}
                  disabled={isLoadingExercises}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: 'var(--color-accent)' }}
                >
                  {isLoadingExercises ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
