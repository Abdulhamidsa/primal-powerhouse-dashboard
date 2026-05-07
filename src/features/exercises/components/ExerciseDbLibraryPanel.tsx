'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { ExerciseAudienceFilter, ExerciseDbExercise } from '@/features/exercises/types/exerciseDb.types';
import { useExerciseDbExercises, useExerciseDbFilterOptions } from '@/features/exercises/hooks/useExerciseDbExercises';

const PAGE_SIZE = 25;

interface ExerciseDbLibraryPanelProps {
  onAssignExerciseAction?: (exercise: ExerciseDbExercise) => void;
  assigningExerciseId?: string | null;
}

export default function ExerciseDbLibraryPanel({
  onAssignExerciseAction,
  assigningExerciseId = null,
}: ExerciseDbLibraryPanelProps) {
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [muscle, setMuscle] = useState('');
  const [equipment, setEquipment] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [audience, setAudience] = useState<ExerciseAudienceFilter>('all');

  const { options, isLoading: isOptionsLoading } = useExerciseDbFilterOptions();

  const { exercises, metadata, isLoading, error } = useExerciseDbExercises({
    offset,
    limit: PAGE_SIZE,
    query,
    muscles: muscle,
    equipment,
    bodyParts: bodyPart,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const filteredByAudience = exercises.filter(exercise => matchesAudienceFilter(exercise, audience));
  const hasPrev = offset > 0;
  const hasNext = Boolean(metadata?.nextPage) || exercises.length === PAGE_SIZE;
  const total = metadata?.totalExercises ?? 0;

  const clearAllFilters = () => {
    setQuery('');
    setMuscle('');
    setEquipment('');
    setBodyPart('');
    setAudience('all');
    setOffset(0);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-zinc-100">ExerciseDB Library</h3>
          <p className="text-zinc-400 text-sm">Browse open-source exercises with GIF demos and metadata</p>
          <p className="text-zinc-500 text-xs mt-1">
            Audience filters (men/women) are guidance presets based on target muscle focus.
          </p>
        </div>

        <div className="w-full lg:w-[560px] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setOffset(0);
            }}
            placeholder="Search exercises"
            className="sm:col-span-2 w-full px-4 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <select
            value={bodyPart}
            onChange={event => {
              setBodyPart(event.target.value);
              setOffset(0);
            }}
            className="px-3 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg"
            disabled={isOptionsLoading}
          >
            <option value="">All body parts</option>
            {options.bodyParts.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={muscle}
            onChange={event => {
              setMuscle(event.target.value);
              setOffset(0);
            }}
            className="px-3 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg"
            disabled={isOptionsLoading}
          >
            <option value="">All target muscles</option>
            {options.muscles.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={equipment}
            onChange={event => {
              setEquipment(event.target.value);
              setOffset(0);
            }}
            className="px-3 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg"
            disabled={isOptionsLoading}
          >
            <option value="">All equipment</option>
            {options.equipments.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'men', label: 'Men' },
                { key: 'women', label: 'Women' },
                { key: 'unisex', label: 'Unisex' },
              ] as Array<{ key: ExerciseAudienceFilter; label: string }>
            ).map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setAudience(item.key);
                  setOffset(0);
                }}
                className={`px-3 py-2 text-xs rounded-lg border ${
                  audience === item.key
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={clearAllFilters}
            className="px-3 py-3 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Clear filters
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">{error}</div>}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-zinc-800 rounded-xl border border-zinc-700 p-4 animate-pulse">
              <div className="h-40 bg-zinc-700 rounded-lg mb-4" />
              <div className="h-4 bg-zinc-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredByAudience.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-lg">No exercises found</p>
          <p className="text-sm mt-2">Try different filters or reset audience presets.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-zinc-400">
              Showing {offset + 1}-{Math.min(offset + filteredByAudience.length, offset + PAGE_SIZE)}
              {total > 0 ? ` of ${total}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredByAudience.map(exercise => (
              <div key={exercise.exerciseId} className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
                <Link
                  href={`/admin/videos/exercises/${exercise.exerciseId}`}
                  className="block p-4 hover:bg-zinc-700/30"
                >
                  <div className="relative w-full h-40 rounded-lg overflow-hidden bg-zinc-900 mb-3">
                    <Image
                      src={exercise.gifUrl}
                      alt={exercise.name}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 1200px) 50vw, 33vw"
                    />
                  </div>

                  <h4 className="text-zinc-100 font-semibold mb-2 line-clamp-2">{exercise.name}</h4>
                  <p className="text-xs text-zinc-400 mb-2">ID: {exercise.exerciseId}</p>

                  <div className="flex flex-wrap gap-2">
                    {(exercise.targetMuscles ?? []).slice(0, 2).map(muscleTag => (
                      <span key={muscleTag} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                        {muscleTag}
                      </span>
                    ))}
                    {(exercise.equipments ?? []).slice(0, 1).map(equipmentTag => (
                      <span key={equipmentTag} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                        {equipmentTag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-700">
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      Body parts: {exercise.bodyParts?.join(', ') || '—'}
                    </p>
                    <p className="text-xs text-blue-300 mt-2">Open details →</p>
                  </div>
                </Link>

                {onAssignExerciseAction && (
                  <div className="px-4 pb-4">
                    <button
                      type="button"
                      onClick={() => onAssignExerciseAction(exercise)}
                      disabled={assigningExerciseId === exercise.exerciseId}
                      className="w-full px-3 py-2 rounded-lg border border-blue-500 bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {assigningExerciseId === exercise.exerciseId ? 'Preparing assignment...' : 'Assign to client'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={!hasPrev || isLoading}
              onClick={() => setOffset(previous => Math.max(0, previous - PAGE_SIZE))}
              className="px-4 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!hasNext || isLoading}
              onClick={() => setOffset(previous => previous + PAGE_SIZE)}
              className="px-4 py-2 rounded-lg border border-blue-500 bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function matchesAudienceFilter(exercise: ExerciseDbExercise, audience: ExerciseAudienceFilter): boolean {
  if (audience === 'all' || audience === 'unisex') {
    return true;
  }

  const tokens = [
    ...(exercise.targetMuscles ?? []),
    ...(exercise.secondaryMuscles ?? []),
    ...(exercise.bodyParts ?? []),
  ]
    .join(' ')
    .toLowerCase();

  const menBiasTokens = ['chest', 'triceps', 'biceps', 'lats', 'forearms', 'delts', 'shoulders'];
  const womenBiasTokens = ['glutes', 'hamstrings', 'quadriceps', 'adductors', 'abductors', 'hips'];

  if (audience === 'men') {
    return menBiasTokens.some(token => tokens.includes(token));
  }

  return womenBiasTokens.some(token => tokens.includes(token));
}
