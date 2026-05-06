'use client';

import { useState } from 'react';
import { useCoachExercises } from '../hooks/useCoachExercises';
import { createExerciseSchema } from '../schemas/exercise.schemas';
import { muscleGroupEnum, equipmentEnum, difficultyLevelEnum } from '../enums/training.enums';
import type { CreateExerciseInput, UpdateExerciseInput } from '../schemas/exercise.schemas';
import type { Exercise } from '@prisma/client';

export function ExerciseLibrary() {
  const [filters, setFilters] = useState<{
    muscleGroup?: string;
    equipment?: string;
    search?: string;
  }>({});

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CreateExerciseInput>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { exercises, isLoading, isError, createExercise, updateExercise, deleteExercise } =
    useCoachExercises(filters);

  const handleOpenForm = (exercise?: Exercise) => {
    if (exercise) {
      setEditingId(exercise.id);
      setFormData({
        name: exercise.name,
        description: exercise.description ?? undefined,
        muscleGroup: exercise.muscleGroup as any,
        equipment: exercise.equipment as any,
      });
    } else {
      setEditingId(null);
      setFormData({});
    }
    setShowForm(true);
    setError(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({});
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const parsed = createExerciseSchema.safeParse(formData);
      if (!parsed.success) {
        setError(parsed.error.flatten().formErrors?.[0] ?? 'Invalid input');
        setIsSubmitting(false);
        return;
      }

      if (editingId) {
        await updateExercise(editingId, parsed.data as UpdateExerciseInput);
      } else {
        await createExercise(parsed.data);
      }

      handleCloseForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;

    try {
      setError(null);
      await deleteExercise(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exercise');
    }
  };

  const muscleGroups = muscleGroupEnum.options;
  const equipmentOptions = equipmentEnum.options;
  const difficultyOptions = difficultyLevelEnum.options;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exercise Library</h1>
        <button
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Exercise
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search exercises..."
          value={filters.search ?? ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filters.muscleGroup ?? ''}
          onChange={(e) => setFilters({ ...filters, muscleGroup: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Muscle Groups</option>
          {muscleGroups.map((group) => (
            <option key={group} value={group}>
              {group.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          value={filters.equipment ?? ''}
          onChange={(e) => setFilters({ ...filters, equipment: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Equipment</option>
          {equipmentOptions.map((equip) => (
            <option key={equip} value={equip}>
              {equip.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4">
            <h2 className="text-xl font-bold">
              {editingId ? 'Edit Exercise' : 'Add Exercise'}
            </h2>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exercise Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name ?? ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Barbell Bench Press"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes about the exercise"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Muscle Group *
                  </label>
                  <select
                    required
                    value={formData.muscleGroup ?? ''}
                    onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select muscle group</option>
                    {muscleGroups.map((group) => (
                      <option key={group} value={group}>
                        {group.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment *
                  </label>
                  <select
                    required
                    value={formData.equipment ?? ''}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select equipment</option>
                    {equipmentOptions.map((equip) => (
                      <option key={equip} value={equip}>
                        {equip.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>



              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-3">
        {isLoading && <p className="text-gray-600">Loading exercises...</p>}
        {isError && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">
            Error loading exercises. Please try again.
          </div>
        )}
        {exercises && exercises.length === 0 && (
          <div className="p-4 bg-gray-100 text-gray-600 rounded-lg text-center">
            No exercises found. Create one to get started!
          </div>
        )}

        {exercises?.map((exercise) => (
          <div
            key={exercise.id}
            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{exercise.name}</h3>
                {exercise.description && (
                  <p className="text-gray-600 text-sm mt-1">{exercise.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                    {exercise.muscleGroup?.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                    {exercise.equipment?.replace(/_/g, ' ')}
                  </span>

                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleOpenForm(exercise)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(exercise.id)}
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
