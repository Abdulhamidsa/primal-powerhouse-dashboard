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

function ExerciseMediaThumb({ exercise }: { exercise: Exercise }) {
  const videoUrl = exercise.videoUrl?.trim();
  const imageUrl = exercise.imageUrl?.trim();

  if (videoUrl) {
    return (
      <video
        src={videoUrl}
        className="h-20 w-28 rounded-2xl border border-white/10 bg-black object-cover"
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  if (imageUrl) {
    return (
      // GIFs should stay animated, so use a regular img instead of Next optimization.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={`${exercise.name} demo`}
        className="h-20 w-28 rounded-2xl border border-white/10 bg-black object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="grid h-20 w-28 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] text-[11px] text-muted-foreground">
      No demo
    </div>
  );
}

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Exercise Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage movements, demo media, muscle groups, and equipment tags.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90"
        >
          Add Exercise
        </button>
      </div>

      <div className="space-y-4 rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Quick Add Custom Exercise</h2>
          <p className="text-sm text-muted-foreground">
            Add a name and a GIF or video. It will be saved to the shared exercise library.
          </p>
        </div>

        {quickError && <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{quickError}</div>}
        {quickSuccess && <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{quickSuccess}</div>}

        <form onSubmit={handleQuickCreate} className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto] md:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Name</label>
            <input
              type="text"
              required
              value={quickName}
              onChange={e => setQuickName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--color-accent)]"
              placeholder="e.g., Band Pull Apart"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">GIF or Video</label>
            <input
              type="file"
              accept="image/gif,image/*,video/*"
              onChange={e => handleQuickMediaChange(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-white/[0.08] file:px-3 file:py-2 file:text-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? 'Saving...' : 'Add custom exercise'}
          </button>

          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium text-muted-foreground">Optional Description</label>
            <textarea
              value={quickDescription}
              onChange={e => setQuickDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--color-accent)]"
              placeholder="Optional note for your own reference"
            />
          </div>

          {quickMediaPreview && (
            <div className="md:col-span-3">
              <p className="mb-2 text-xs text-muted-foreground">Preview</p>
              {quickMediaFile?.type.startsWith('video/') ? (
                <video
                  src={quickMediaPreview}
                  className="max-h-64 w-full rounded-xl border border-white/10 bg-black object-contain"
                  controls
                />
              ) : (
                <Image
                  src={quickMediaPreview}
                  alt="Custom exercise preview"
                  width={640}
                  height={360}
                  className="max-h-64 w-full rounded-xl border border-white/10 object-contain"
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
          className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--color-accent)]"
        />
        <select
          value={filters.muscleGroup ?? ''}
          onChange={e => setFilters({ ...filters, muscleGroup: e.target.value || undefined })}
          className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-foreground outline-none focus:border-[var(--color-accent)]"
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
          className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-foreground outline-none focus:border-[var(--color-accent)]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl space-y-4 rounded-[28px] border border-white/10 bg-[var(--color-surface)] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-foreground">{editingId ? 'Edit Exercise' : 'Add Exercise'}</h2>

            {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Exercise Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name ?? ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--color-accent)]"
                  placeholder="e.g., Barbell Bench Press"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Description</label>
                <textarea
                  value={formData.description ?? ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value || undefined })}
                  className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--color-accent)]"
                  placeholder="Optional notes about the exercise"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">Muscle Group *</label>
                  <select
                    required
                    value={formData.muscleGroup ?? ''}
                    onChange={e => setFormData({ ...formData, muscleGroup: e.target.value as any })}
                    className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none focus:border-[var(--color-accent)]"
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
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">Equipment *</label>
                  <select
                    required
                    value={formData.equipment ?? ''}
                    onChange={e => setFormData({ ...formData, equipment: e.target.value as any })}
                    className="w-full rounded-xl border border-white/10 bg-[var(--color-bg)] px-3 py-2 text-foreground outline-none focus:border-[var(--color-accent)]"
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
                  className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-foreground transition-colors hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-[var(--color-accent)] px-4 py-2 font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
        {isLoading && <p className="text-muted-foreground">Loading exercises...</p>}
        {isError && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">Error loading exercises. Please try again.</div>
        )}
        {exercises && exercises.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-muted-foreground">
            No exercises found. Create one to get started!
          </div>
        )}

        {exercises?.map(exercise => (
          <div
            key={exercise.id}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:border-white/20"
          >
            <div className="flex items-start justify-between gap-4">
              <ExerciseMediaThumb exercise={exercise} />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-foreground">{exercise.name}</h3>
                {exercise.description && <p className="mt-1 text-sm text-muted-foreground">{exercise.description}</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent-translucent)] px-2 py-1 text-xs font-semibold text-[var(--color-accent)]">
                    {exercise.muscleGroup?.replace(/_/g, ' ')}
                  </span>
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-200">
                    {exercise.equipment?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleOpenForm(exercise)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.07]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(exercise.id)}
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
