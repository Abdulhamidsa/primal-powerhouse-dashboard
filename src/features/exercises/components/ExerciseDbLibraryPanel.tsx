'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { ExerciseDbExercise } from '@/features/exercises/types/exerciseDb.types';
import { useRapidAPIExercises } from '@/features/exercises/hooks/useRapidAPIExercises';
import { useRapidAPIFilterOptions } from '@/features/exercises/hooks/useRapidAPIFilterOptions';
import ExerciseFilters from './ExerciseFilters';

interface ExerciseDbLibraryPanelProps {
  onAssignExerciseAction?: (exercise: ExerciseDbExercise) => void;
  assigningExerciseId?: string | null;
}

export default function ExerciseDbLibraryPanel({
  onAssignExerciseAction,
  assigningExerciseId = null,
}: ExerciseDbLibraryPanelProps) {
  const [assigningLoadingId, setAssigningLoadingId] = useState<string | null>(null);
  const filterOptions = useRapidAPIFilterOptions();
  const { exercises, isLoading, error, query, setQuery, filters, updateFilters, clearFilters, hasMore, loadMore } =
    useRapidAPIExercises();

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-zinc-100">RapidAPI ExerciseDB</h3>
          <p className="text-zinc-400 text-sm">Search 11,000+ exercises with advanced filters</p>
          <p className="text-zinc-500 text-xs mt-1">Powered by RapidAPI ExerciseDB V2 with rich metadata</p>
        </div>

        <div className="w-full lg:w-[560px] space-y-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search exercises (e.g., bench press, squat)"
            className="w-full px-4 py-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

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
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">{error}</div>}

      {isLoading && exercises.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-zinc-800 rounded-xl border border-zinc-700 p-4 animate-pulse">
              <div className="h-40 bg-zinc-700 rounded-lg mb-4" />
              <div className="h-4 bg-zinc-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-lg">No exercises found</p>
          <p className="text-sm mt-2">Try different search terms or filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {exercises.map(exercise => (
              <div key={exercise.exerciseId} className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
                <Link
                  href={`/admin/videos/exercises/${exercise.exerciseId}`}
                  className="block p-4 hover:bg-zinc-700/30"
                >
                  <div className="relative w-full h-40 rounded-lg overflow-hidden bg-zinc-900 mb-3">
                    {exercise.videoUrl ? (
                      <video
                        src={exercise.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                    ) : exercise.gifUrl ? (
                      <Image
                        src={exercise.gifUrl}
                        alt={exercise.name}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 1200px) 50vw, 33vw"
                      />
                    ) : exercise.imageUrl ? (
                      <Image
                        src={exercise.imageUrl}
                        alt={exercise.name}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-700" />
                    )}
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
                      onClick={() => {
                        setAssigningLoadingId(exercise.exerciseId);
                        onAssignExerciseAction(exercise);
                      }}
                      disabled={
                        assigningLoadingId === exercise.exerciseId || assigningExerciseId === exercise.exerciseId
                      }
                      className="w-full px-3 py-2 rounded-lg border border-blue-500 bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {assigningLoadingId === exercise.exerciseId || assigningExerciseId === exercise.exerciseId
                        ? 'Preparing assignment...'
                        : 'Assign to client'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex items-center justify-center">
              <button
                type="button"
                disabled={isLoading}
                onClick={loadMore}
                className="px-6 py-3 rounded-lg border border-blue-500 bg-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Load more exercises'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
