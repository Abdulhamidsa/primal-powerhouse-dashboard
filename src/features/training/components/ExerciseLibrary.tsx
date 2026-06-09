'use client';

import { useState } from 'react';
import { useCoachExercises } from '../hooks/useCoachExercises';
import { useQuickExerciseCreate } from '../hooks/useQuickExerciseCreate';
import { createExerciseSchema } from '../schemas/exercise.schemas';
import { quickExerciseCreateSchema } from '../schemas/quickExercise.schemas';
import { muscleGroupEnum, equipmentEnum } from '../enums/training.enums';
import type { CreateExerciseInput, UpdateExerciseInput } from '../schemas/exercise.schemas';
import type { Exercise } from '@prisma/client';
import Image from 'next/image';

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
  const [quickName, setQuickName] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [quickMediaFile, setQuickMediaFile] = useState<File | null>(null);
  const [quickMediaPreview, setQuickMediaPreview] = useState<string | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);

  const {
    exercises,
    isLoading,
    isError,
    createExercise,
    updateExercise,
    deleteExercise,
    mutate: mutateExercises,
  } = useCoachExercises(filters);
  const { createQuickExercise, isUploading } = useQuickExerciseCreate();

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

  const handleQuickMediaChange = (file: File | null) => {
    setQuickMediaFile(file);
    setQuickMediaPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleQuickCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setQuickError(null);
    setQuickSuccess(null);

    const mediaKind = quickMediaFile?.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    const parsed = quickExerciseCreateSchema.safeParse({
      name: quickName,
      description: quickDescription || undefined,
      mediaKind,
    });

    if (!parsed.success) {
      setQuickError(parsed.error.flatten().formErrors?.[0] ?? 'Invalid input');
      return;
    }

    if (!quickMediaFile) {
      setQuickError('Please upload a GIF or video file.');
      return;
    }

    try {
      await createQuickExercise({
        ...parsed.data,
        mediaFile: quickMediaFile,
      });
      setQuickName('');
      setQuickDescription('');
      handleQuickMediaChange(null);
      setQuickSuccess('Custom exercise added.');
      await mutateExercises();
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : 'Failed to add exercise');
    }
  };

  const muscleGroups = muscleGroupEnum.options;
  const equipmentOptions = equipmentEnum.options;

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

      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quick Add Custom Exercise</h2>
          <p className="text-sm text-gray-600">
            Add a name and a GIF or video. It will be saved to the shared exercise library.
          </p>
        </div>

        {quickError && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{quickError}</div>}
        {quickSuccess && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">{quickSuccess}</div>}

        <form onSubmit={handleQuickCreate} className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto] md:items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={quickName}
              onChange={e => setQuickName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Band Pull Apart"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GIF or Video</label>
            <input
              type="file"
              accept="image/gif,image/*,video/*"
              onChange={e => handleQuickMediaChange(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-700"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Saving...' : 'Add custom exercise'}
          </button>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Optional Description</label>
            <textarea
              value={quickDescription}
              onChange={e => setQuickDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional note for your own reference"
            />
          </div>

          {quickMediaPreview && (
            <div className="md:col-span-3">
              <p className="text-xs text-gray-500 mb-2">Preview</p>
              {quickMediaFile?.type.startsWith('video/') ? (
                <video
                  src={quickMediaPreview}
                  className="w-full max-h-64 rounded-lg border object-contain bg-black"
                  controls
                />
              ) : (
                <Image
                  src={quickMediaPreview}
                  alt="Custom exercise preview"
                  width={640}
                  height={360}
                  className="w-full max-h-64 rounded-lg border object-contain"
                />
              )}
            </div>
          )}
        </form>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search exercises..."
          value={filters.search ?? ''}
          onChange={e => setFilters({ ...filters, search: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filters.muscleGroup ?? ''}
          onChange={e => setFilters({ ...filters, muscleGroup: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Muscle Groups</option>
          {muscleGroups.map(group => (
            <option key={group} value={group}>
              {group.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          value={filters.equipment ?? ''}
          onChange={e => setFilters({ ...filters, equipment: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Equipment</option>
          {equipmentOptions.map(equip => (
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
            <h2 className="text-xl font-bold">{editingId ? 'Edit Exercise' : 'Add Exercise'}</h2>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name ?? ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Barbell Bench Press"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description ?? ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes about the exercise"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Muscle Group *</label>
                  <select
                    required
                    value={formData.muscleGroup ?? ''}
                    onChange={e => setFormData({ ...formData, muscleGroup: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select muscle group</option>
                    {muscleGroups.map(group => (
                      <option key={group} value={group}>
                        {group.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipment *</label>
                  <select
                    required
                    value={formData.equipment ?? ''}
                    onChange={e => setFormData({ ...formData, equipment: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select equipment</option>
                    {equipmentOptions.map(equip => (
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
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">Error loading exercises. Please try again.</div>
        )}
        {exercises && exercises.length === 0 && (
          <div className="p-4 bg-gray-100 text-gray-600 rounded-lg text-center">
            No exercises found. Create one to get started!
          </div>
        )}

        {exercises?.map(exercise => (
          <div
            key={exercise.id}
            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{exercise.name}</h3>
                {exercise.description && <p className="text-gray-600 text-sm mt-1">{exercise.description}</p>}
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
