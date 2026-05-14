import { httpClient } from '@/lib/http/client';
import type {
  ExerciseDbOptionsResponse,
  ExerciseDbQueryParams,
  ExerciseDbResponse,
  ExerciseDbSingleResponse,
} from '@/features/exercises/types/exerciseDb.types';
import type { RapidAPIFilters } from '@/features/exercises/types/rapidapi-filters.types';

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

/**
 * Search RapidAPI ExerciseDB V2 with advanced filtering
 * @param query - Search query (exercise name)
 * @param filters - Filter options (bodyParts, equipments, targetMuscles, difficulty)
 * @param offset - Pagination offset
 * @param limit - Results per page (max 25)
 */
export async function getRapidAPIExercises(
  query: string = '',
  filters: RapidAPIFilters = {},
  offset: number = 0,
  limit: number = 25,
  fetchAll: boolean = false,
): Promise<ExerciseDbResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('offset', String(offset));
  // Keep UI page size stable.
  searchParams.set('limit', String(Math.min(25, Math.max(1, limit))));

  if (query.trim().length > 0) {
    searchParams.set('q', query.trim());
  }

  if (filters.bodyParts && filters.bodyParts.length > 0) {
    searchParams.set('bodyParts', filters.bodyParts.join(','));
  }

  if (filters.equipments && filters.equipments.length > 0) {
    searchParams.set('equipment', filters.equipments.join(','));
  }

  if (filters.targetMuscles && filters.targetMuscles.length > 0) {
    searchParams.set('muscles', filters.targetMuscles.join(','));
  }

  if (fetchAll) {
    searchParams.set('limit', '200');
  }

  // Kept for compatibility with existing hook/component names; now points to the previous ExerciseDB route.
  return httpClient.get<ExerciseDbResponse>(`/api/exercise-db/exercises?${searchParams.toString()}`);
}
