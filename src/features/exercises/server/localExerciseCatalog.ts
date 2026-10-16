import { prisma } from '@/lib/prisma';
import type { ExerciseCatalogExercise } from '@/features/exercises/types/exerciseCatalog.types';

function split(value: string | null | undefined) {
  return value
    ?.split('\n')
    .map(item => item.trim())
    .filter(Boolean) ?? [];
}

export function localExerciseToCatalog(exercise: {
  id: string;
  name: string;
  description: string | null;
  muscleGroup: string;
  muscleGroupSecondary: string | null;
  equipment: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  instructions: string | null;
}): ExerciseCatalogExercise {
  const muscleGroup = exercise.muscleGroup.replace(/_/g, ' ');
  const equipment = exercise.equipment?.replace(/_/g, ' ') || '';
  return {
    exerciseId: exercise.id,
    providerId: `local:${exercise.id}`,
    name: exercise.name,
    gifUrl: exercise.imageUrl?.toLowerCase().includes('.gif') ? exercise.imageUrl : '',
    imageUrl: exercise.imageUrl || '',
    videoUrl: exercise.videoUrl || undefined,
    thumbnailUrl: exercise.imageUrl || undefined,
    targetMuscles: [muscleGroup],
    bodyParts: [muscleGroup],
    equipments: equipment ? [equipment] : [],
    secondaryMuscles: exercise.muscleGroupSecondary ? [exercise.muscleGroupSecondary.replace(/_/g, ' ')] : [],
    instructions: split(exercise.instructions),
    overview: exercise.description || '',
  };
}

export async function getLocalExerciseCatalogPage(params: {
  coachId: string;
  offset: number;
  limit: number;
  q: string;
  muscles: string;
  equipment: string;
  bodyParts: string;
}) {
  const exercises = await prisma.exercise.findMany({ where: { coachId: params.coachId }, orderBy: { name: 'asc' } });
  const q = params.q.toLowerCase();
  const muscles = params.muscles.toLowerCase().split(',').map(item => item.trim()).filter(Boolean);
  const equipment = params.equipment.toLowerCase().split(',').map(item => item.trim()).filter(Boolean);
  const bodyParts = params.bodyParts.toLowerCase().split(',').map(item => item.trim()).filter(Boolean);

  const filtered = exercises
    .map(localExerciseToCatalog)
    .filter(exercise => {
      const searchable = [
        exercise.name,
        exercise.overview,
        ...(exercise.targetMuscles ?? []),
        ...(exercise.bodyParts ?? []),
        ...(exercise.equipments ?? []),
      ]
        .join(' ')
        .toLowerCase();
      if (q && !searchable.includes(q)) return false;
      if (muscles.length && !muscles.some(value => (exercise.targetMuscles ?? []).some(item => item.toLowerCase().includes(value)))) return false;
      if (equipment.length && !equipment.some(value => (exercise.equipments ?? []).some(item => item.toLowerCase().includes(value)))) return false;
      if (bodyParts.length && !bodyParts.some(value => (exercise.bodyParts ?? []).some(item => item.toLowerCase().includes(value)))) return false;
      return true;
    });

  return {
    data: filtered.slice(params.offset, params.offset + params.limit),
    total: filtered.length,
  };
}
