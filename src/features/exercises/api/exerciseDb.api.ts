import { httpClient } from '@/lib/http/client';
import type {
  ExerciseDbOptionsResponse,
  ExerciseDbQueryParams,
  ExerciseDbResponse,
  ExerciseDbSingleResponse,
} from '@/features/exercises/types/exerciseDb.types';

export async function getExerciseDbExercises(params: ExerciseDbQueryParams = {}): Promise<ExerciseDbResponse> {
  const searchParams = new URLSearchParams();

  const offset = params.offset ?? 0;
  const limit = params.limit ?? 25;
  const q = (params.q ?? '').trim();
  const muscles = (params.muscles ?? '').trim();
  const equipment = (params.equipment ?? '').trim();
  const bodyParts = (params.bodyParts ?? '').trim();
  const sortBy = params.sortBy ?? 'name';
  const sortOrder = params.sortOrder ?? 'asc';

  searchParams.set('offset', String(offset));
  searchParams.set('limit', String(limit));

  if (q.length > 0) {
    searchParams.set('q', q);
  }

  if (muscles.length > 0) {
    searchParams.set('muscles', muscles);
  }

  if (equipment.length > 0) {
    searchParams.set('equipment', equipment);
  }

  if (bodyParts.length > 0) {
    searchParams.set('bodyParts', bodyParts);
  }

  searchParams.set('sortBy', sortBy);
  searchParams.set('sortOrder', sortOrder);

  return httpClient.get<ExerciseDbResponse>(`/api/exercise-db/exercises?${searchParams.toString()}`);
}

export async function getExerciseDbExerciseById(exerciseId: string): Promise<ExerciseDbSingleResponse> {
  return httpClient.get<ExerciseDbSingleResponse>(`/api/exercise-db/exercises/${encodeURIComponent(exerciseId)}`);
}

export async function getExerciseDbFilterOptions(): Promise<ExerciseDbOptionsResponse> {
  return httpClient.get<ExerciseDbOptionsResponse>('/api/exercise-db/options');
}
