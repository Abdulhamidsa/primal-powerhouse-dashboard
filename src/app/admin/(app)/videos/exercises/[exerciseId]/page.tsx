'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useExerciseDbExercise } from '@/features/exercises/hooks/useExerciseDbExercises';

export default function ExerciseDetailsPage() {
  const params = useParams<{ exerciseId: string }>();
  const exerciseId = decodeURIComponent(params.exerciseId ?? '');

  const { exercise, isLoading, error } = useExerciseDbExercise(exerciseId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/admin/videos"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          ← Back to videos
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-zinc-800 rounded-xl animate-pulse" />
          <div className="space-y-3">
            <div className="h-8 bg-zinc-800 rounded animate-pulse" />
            <div className="h-6 bg-zinc-800 rounded animate-pulse" />
            <div className="h-24 bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">{error}</div>
      ) : !exercise ? (
        <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300">Exercise not found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="relative w-full aspect-square max-h-[520px] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-700">
              <Image
                src={exercise.gifUrl}
                alt={exercise.name}
                fill
                unoptimized
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Exercise ID: {exercise.exerciseId}</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 leading-tight">{exercise.name}</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoBlock label="Target Muscles" values={exercise.targetMuscles ?? []} tone="blue" />
              <InfoBlock label="Secondary Muscles" values={exercise.secondaryMuscles ?? []} tone="emerald" />
              <InfoBlock label="Body Parts" values={exercise.bodyParts ?? []} tone="purple" />
              <InfoBlock label="Equipment" values={exercise.equipments ?? []} tone="amber" />
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">How to perform</h2>
              {!exercise.instructions || exercise.instructions.length === 0 ? (
                <p className="text-zinc-400">No instructions provided.</p>
              ) : (
                <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                  {exercise.instructions.map(step => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({
  label,
  values,
  tone,
}: {
  label: string;
  values: string[];
  tone: 'blue' | 'emerald' | 'purple' | 'amber';
}) {
  const toneClass =
    tone === 'blue'
      ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
      : tone === 'emerald'
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        : tone === 'purple'
          ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-300';

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <p className="text-xs uppercase tracking-wide mb-2 opacity-80">{label}</p>
      {values.length === 0 ? (
        <p className="text-sm opacity-80">—</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {values.map(value => (
            <span key={value} className="text-xs px-2 py-1 rounded bg-black/20 border border-white/10">
              {value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
