'use client';

import { useState } from 'react';
import { useCoachExercises } from '../hooks/useCoachExercises';
import { useCoachTemplates } from '../hooks/useCoachTemplates';
import { useExerciseDbExercises } from '@/features/exercises/hooks/useExerciseDbExercises';
import { createWorkoutTemplateSchema } from '../schemas/template.schemas';
import { difficultyLevelEnum } from '../enums/training.enums';
import type { TemplateExerciseInput, CreateWorkoutTemplateInput } from '../schemas/template.schemas';
import type { WorkoutTemplateWithExercises } from '../types';
import type { ExerciseDbExercise } from '@/features/exercises/types/exerciseDb.types';

type ExercisePickerOption =
  | { key: string; source: 'local'; id: string; name: string }
  | { key: string; source: 'catalog'; id: string; name: string; exercise: ExerciseDbExercise };

export function TemplateBuilder() {
  const { exercises, importExerciseDbExercise } = useCoachExercises();
  const [exerciseSearch, setExerciseSearch] = useState('');
  const {
    exercises: catalogExercises,
    metadata: catalogMetadata,
    isLoading: catalogLoading,
    error: catalogError,
  } = useExerciseDbExercises({
    offset: 0,
    limit: 25,
    query: exerciseSearch,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const {
    templates,
    isLoading: templatesLoading,
    isError: templatesError,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useCoachTemplates();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description?: string;
    goal?: string;
    difficulty?: string;
    exercises: TemplateExerciseInput[];
  }>({
    name: '',
    exercises: [],
  });

  const [selectedExerciseKey, setSelectedExerciseKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenForm = (template?: WorkoutTemplateWithExercises) => {
    if (template) {
      setEditingId(template.id);
      setFormData({
        name: template.name,
        description: template.description ?? undefined,
        goal: template.goal ?? undefined,
        difficulty: template.difficulty ?? undefined,
        exercises: template.exercises.map((templateExercise, index) => ({
          exerciseId: templateExercise.exerciseId,
          order: templateExercise.order ?? index,
          sets: templateExercise.sets,
          reps: templateExercise.reps,
          restSeconds: templateExercise.restSeconds,
          targetRpe: templateExercise.targetRpe,
          targetTempo: templateExercise.targetTempo,
          notes: templateExercise.notes,
        })),
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        exercises: [],
      });
    }
    setShowForm(true);
    setError(null);
    setExerciseSearch('');
    setSelectedExerciseKey('');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', exercises: [] });
    setSelectedExerciseKey('');
    setExerciseSearch('');
    setError(null);
  };

  const handleAddExercise = async () => {
    if (!selectedExerciseKey) {
      setError('Please select an exercise');
      return;
    }

    setIsAddingExercise(true);
    try {
      const selectedOption = pickerOptions.find(option => option.key === selectedExerciseKey);
      if (!selectedOption) {
        setError('Please select an exercise');
        return;
      }

      let exerciseId = selectedOption.id;

      if (selectedOption.source === 'catalog') {
        const imported = await importExerciseDbExercise({
          exerciseId: selectedOption.exercise.exerciseId,
          name: selectedOption.exercise.name,
          gifUrl: selectedOption.exercise.gifUrl || null,
          imageUrl: selectedOption.exercise.imageUrl || selectedOption.exercise.gifUrl || null,
          videoUrl: selectedOption.exercise.videoUrl || null,
          targetMuscles: selectedOption.exercise.targetMuscles ?? [],
          bodyParts: selectedOption.exercise.bodyParts ?? [],
          equipments: selectedOption.exercise.equipments ?? [],
          secondaryMuscles: selectedOption.exercise.secondaryMuscles ?? [],
          instructions: selectedOption.exercise.instructions ?? [],
          overview: selectedOption.exercise.overview || null,
        });
        exerciseId = imported.id;
      }

      const newExercise: TemplateExerciseInput = {
        exerciseId,
        order: formData.exercises.length,
        sets: 3,
        reps: 8,
        restSeconds: 120,
      };

      setFormData({
        ...formData,
        exercises: [...formData.exercises, newExercise],
      });
      setSelectedExerciseKey('');
      setExerciseSearch('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add exercise');
    } finally {
      setIsAddingExercise(false);
    }
  };

  const handleRemoveExercise = (index: number) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index).map((e, i) => ({ ...e, order: i })),
    });
  };

  const handleUpdateExercise = (index: number, updates: Partial<TemplateExerciseInput>) => {
    const updated = [...formData.exercises];
    updated[index] = { ...updated[index], ...updates };
    setFormData({ ...formData, exercises: updated });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const parsed = createWorkoutTemplateSchema.safeParse(formData);
      if (!parsed.success) {
        setError(parsed.error.flatten().formErrors?.[0] ?? 'Invalid input');
        setIsSubmitting(false);
        return;
      }

      if (editingId) {
        await updateTemplate(editingId, parsed.data as CreateWorkoutTemplateInput);
      } else {
        await createTemplate(parsed.data as CreateWorkoutTemplateInput);
      }

      handleCloseForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      setError(null);
      await deleteTemplate(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const getExerciseName = (id: string) => exercises?.find(e => e.id === id)?.name ?? 'Unknown';
  const localPickerOptions: ExercisePickerOption[] = (exercises ?? [])
    .filter(exercise => exercise.name.toLowerCase().includes(exerciseSearch.trim().toLowerCase()))
    .slice(0, 20)
    .map(exercise => ({ key: `local:${exercise.id}`, source: 'local', id: exercise.id, name: exercise.name }));
  const localOptionNames = new Set(localPickerOptions.map(option => option.name.toLowerCase()));
  const catalogPickerOptions: ExercisePickerOption[] = catalogExercises
    .filter(exercise => !localOptionNames.has(exercise.name.toLowerCase()))
    .slice(0, 25)
    .map(exercise => ({
      key: `catalog:${exercise.exerciseId}`,
      source: 'catalog',
      id: exercise.exerciseId,
      name: exercise.name,
      exercise,
    }));
  const catalogTotal = catalogMetadata
    ? ('total' in catalogMetadata ? catalogMetadata.total : catalogMetadata.totalExercises)
    : null;
  const pickerOptions = [...localPickerOptions, ...catalogPickerOptions];
  const difficultyOptions = difficultyLevelEnum.options;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Workout Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Build reusable workouts from your exercise library and catalog imports.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90"
        >
          Create Template
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl space-y-4 overflow-y-auto rounded-[28px] border border-white/10 bg-[var(--color-surface)] p-6 shadow-2xl">
            <h2 className="sticky top-0 bg-[var(--color-surface)] py-1 text-xl font-semibold text-foreground">
              {editingId ? 'Edit Template' : 'Create Template'}
            </h2>

            {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Template Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--color-accent)]"
                  placeholder="e.g., Upper Body Strength"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Description</label>
                <textarea
                  value={formData.description ?? ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value || undefined })}
                  className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--color-accent)]"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">Goal</label>
                  <input
                    type="text"
                    value={formData.goal ?? ''}
                    onChange={e => setFormData({ ...formData, goal: e.target.value || undefined })}
                    className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--color-accent)]"
                    placeholder="e.g., Hypertrophy"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">Difficulty</label>
                  <select
                    value={formData.difficulty ?? ''}
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value || undefined })}
                    className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="">Select difficulty</option>
                    {difficultyOptions.map(diff => (
                      <option key={diff} value={diff}>
                        {diff.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exercises Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Exercises</h3>

                {/* Exercise Selector */}
                <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">Find exercise</label>
                  <input
                    type="search"
                    value={exerciseSearch}
                    onChange={e => {
                      setExerciseSearch(e.target.value);
                      setSelectedExerciseKey('');
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--color-accent)]"
                    placeholder="Search all exercises by name"
                  />
                  <div className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                    <select
                      value={selectedExerciseKey}
                      onChange={e => setSelectedExerciseKey(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="">
                        {exerciseSearch ? 'Select a matching exercise' : 'Select an exercise to add'}
                      </option>
                      {localPickerOptions.length > 0 ? (
                        <optgroup label="Your Training Library">
                          {localPickerOptions.map(option => (
                            <option key={option.key} value={option.key}>
                              {option.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      {catalogPickerOptions.length > 0 ? (
                        <optgroup label="ExerciseDB Catalog">
                          {catalogPickerOptions.map(option => (
                            <option key={option.key} value={option.key}>
                              {option.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      {catalogLoading ? (
                        <option value="" disabled>
                          Loading catalog exercises...
                        </option>
                      ) : null}
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleAddExercise()}
                      disabled={isAddingExercise}
                      className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {isAddingExercise ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Showing {localPickerOptions.length} local and {catalogPickerOptions.length} catalog exercises
                    {catalogTotal ? ` (${catalogTotal} catalog matches)` : ''}.
                    {catalogError ? ` Catalog error: ${catalogError}` : ''}
                  </p>
                </div>

                {/* Exercise List */}
                <div className="space-y-2">
                  {formData.exercises.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No exercises added yet</p>
                  ) : (
                    formData.exercises.map((ex, idx) => (
                      <div key={idx} className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{getExerciseName(ex.exerciseId)}</p>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">Sets</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={ex.sets}
                                  onChange={e => handleUpdateExercise(idx, { sets: parseInt(e.target.value) })}
                                  className="w-full rounded-lg border border-white/10 bg-[var(--color-bg)] px-2 py-1 text-sm text-foreground"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">Reps</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={ex.reps}
                                  onChange={e => handleUpdateExercise(idx, { reps: parseInt(e.target.value) })}
                                  className="w-full rounded-lg border border-white/10 bg-[var(--color-bg)] px-2 py-1 text-sm text-foreground"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">Rest (s)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="600"
                                  value={ex.restSeconds}
                                  onChange={e => handleUpdateExercise(idx, { restSeconds: parseInt(e.target.value) })}
                                  className="w-full rounded-lg border border-white/10 bg-[var(--color-bg)] px-2 py-1 text-sm text-foreground"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(idx)}
                                className="mt-5 h-fit rounded-lg border border-red-400/25 bg-red-500/10 px-2 py-1 text-sm text-red-100 transition-colors hover:bg-red-500/15"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="mt-2">
                              <label className="mb-1 block text-xs text-muted-foreground">Coach note</label>
                              <textarea
                                value={ex.notes ?? ''}
                                onChange={e => handleUpdateExercise(idx, { notes: e.target.value || null })}
                                rows={2}
                                className="w-full rounded-lg border border-white/10 bg-[var(--color-bg)] px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground"
                                placeholder="Optional cue, setup note, or coaching focus"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-foreground transition-colors hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || formData.exercises.length === 0}
                  className="flex-1 rounded-xl bg-[var(--color-accent)] px-4 py-2 font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-3">
        {templatesLoading && <p className="text-muted-foreground">Loading templates...</p>}
        {templatesError && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">Error loading templates. Please try again.</div>
        )}
        {templates && templates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-muted-foreground">
            No templates created yet. Create one to get started!
          </div>
        )}

        {templates?.map(template => (
          <div
            key={template.id}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:border-white/20"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                {template.description && <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>}
                {template.goal && <p className="text-sm text-muted-foreground">Goal: {template.goal}</p>}
                <p className="mt-2 text-sm text-muted-foreground">
                  {template.exercises.length} exercise{template.exercises.length === 1 ? '' : 's'}
                </p>
                {template.exercises.length > 0 ? (
                  <ol className="mt-2 space-y-1 text-sm text-foreground">
                    {template.exercises.slice(0, 4).map((templateExercise, index) => (
                      <li key={templateExercise.id} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate">
                          {index + 1}. {templateExercise.exercise?.name ?? getExerciseName(templateExercise.exerciseId)}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {templateExercise.sets}x{templateExercise.reps} · {templateExercise.restSeconds}s
                        </span>
                      </li>
                    ))}
                    {template.exercises.length > 4 ? (
                      <li className="text-xs text-muted-foreground">+{template.exercises.length - 4} more</li>
                    ) : null}
                  </ol>
                ) : null}
                {template.difficulty && (
                  <span className="mt-2 inline-block rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent-translucent)] px-2 py-1 text-xs font-semibold text-[var(--color-accent)]">
                    {template.difficulty.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleOpenForm(template)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.07]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-100 transition-colors hover:bg-red-500/15"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
