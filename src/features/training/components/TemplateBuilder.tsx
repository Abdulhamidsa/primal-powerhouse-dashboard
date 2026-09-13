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
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workout Templates</h1>
        <button
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Template
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold sticky top-0 bg-white">
              {editingId ? 'Edit Template' : 'Create Template'}
            </h2>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Upper Body Strength"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description ?? ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                  <input
                    type="text"
                    value={formData.goal ?? ''}
                    onChange={e => setFormData({ ...formData, goal: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Hypertrophy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty ?? ''}
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Find exercise</label>
                  <input
                    type="search"
                    value={exerciseSearch}
                    onChange={e => {
                      setExerciseSearch(e.target.value);
                      setSelectedExerciseKey('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search all exercises by name"
                  />
                  <div className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                    <select
                      value={selectedExerciseKey}
                      onChange={e => setSelectedExerciseKey(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isAddingExercise ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Showing {localPickerOptions.length} local and {catalogPickerOptions.length} catalog exercises
                    {catalogTotal ? ` (${catalogTotal} catalog matches)` : ''}.
                    {catalogError ? ` Catalog error: ${catalogError}` : ''}
                  </p>
                </div>

                {/* Exercise List */}
                <div className="space-y-2">
                  {formData.exercises.length === 0 ? (
                    <p className="text-gray-500 text-sm">No exercises added yet</p>
                  ) : (
                    formData.exercises.map((ex, idx) => (
                      <div key={idx} className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{getExerciseName(ex.exerciseId)}</p>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Sets</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={ex.sets}
                                  onChange={e => handleUpdateExercise(idx, { sets: parseInt(e.target.value) })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Reps</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={ex.reps}
                                  onChange={e => handleUpdateExercise(idx, { reps: parseInt(e.target.value) })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Rest (s)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="600"
                                  value={ex.restSeconds}
                                  onChange={e => handleUpdateExercise(idx, { restSeconds: parseInt(e.target.value) })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(idx)}
                                className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors h-fit mt-5"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="mt-2">
                              <label className="block text-xs text-gray-600 mb-1">Coach note</label>
                              <textarea
                                value={ex.notes ?? ''}
                                onChange={e => handleUpdateExercise(idx, { notes: e.target.value || null })}
                                rows={2}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || formData.exercises.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        {templatesLoading && <p className="text-gray-600">Loading templates...</p>}
        {templatesError && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">Error loading templates. Please try again.</div>
        )}
        {templates && templates.length === 0 && (
          <div className="p-4 bg-gray-100 text-gray-600 rounded-lg text-center">
            No templates created yet. Create one to get started!
          </div>
        )}

        {templates?.map(template => (
          <div
            key={template.id}
            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{template.name}</h3>
                {template.description && <p className="text-gray-600 text-sm mt-1">{template.description}</p>}
                {template.goal && <p className="text-gray-500 text-sm">Goal: {template.goal}</p>}
                <p className="mt-2 text-sm text-gray-600">
                  {template.exercises.length} exercise{template.exercises.length === 1 ? '' : 's'}
                </p>
                {template.exercises.length > 0 ? (
                  <ol className="mt-2 space-y-1 text-sm text-gray-700">
                    {template.exercises.slice(0, 4).map((templateExercise, index) => (
                      <li key={templateExercise.id} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate">
                          {index + 1}. {templateExercise.exercise?.name ?? getExerciseName(templateExercise.exerciseId)}
                        </span>
                        <span className="shrink-0 text-xs text-gray-500">
                          {templateExercise.sets}x{templateExercise.reps} · {templateExercise.restSeconds}s
                        </span>
                      </li>
                    ))}
                    {template.exercises.length > 4 ? (
                      <li className="text-xs text-gray-500">+{template.exercises.length - 4} more</li>
                    ) : null}
                  </ol>
                ) : null}
                {template.difficulty && (
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-medium mt-2">
                    {template.difficulty.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleOpenForm(template)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium transition-colors"
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
