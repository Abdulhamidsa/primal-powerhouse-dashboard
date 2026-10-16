import { httpClient } from '@/lib/http/client';
import type {
  ExerciseCatalogOptionsResponse,
  ExerciseCatalogQueryParams,
  ExerciseCatalogResponse,
  ExerciseCatalogSingleResponse,
} from '@/features/exercises/types/exerciseCatalog.types';
import type { ExerciseCatalogFilters } from '@/features/exercises/types/exerciseCatalogFilters.types';

export const EXERCISE_CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
export const EXERCISE_CATALOG_OPTIONS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const exerciseCache = new Map<string, CacheEntry<ExerciseCatalogResponse>>();
const exerciseInFlight = new Map<string, Promise<ExerciseCatalogResponse>>();
const detailCache = new Map<string, CacheEntry<ExerciseCatalogSingleResponse>>();
const detailInFlight = new Map<string, Promise<ExerciseCatalogSingleResponse>>();
let optionsCache: CacheEntry<ExerciseCatalogOptionsResponse> | null = null;
let optionsInFlight: Promise<ExerciseCatalogOptionsResponse> | null = null;

function getCached<T>(
  cache: Map<string, CacheEntry<T>>,
  inFlight: Map<string, Promise<T>>,
  key: string,
  ttlMs: number,
  request: () => Promise<T>,
): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);

  const pending = inFlight.get(key);
  if (pending) return pending;

  const next = request()
    .then(value => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, next);
  return next;
}

export async function getExerciseCatalogExercises(params: ExerciseCatalogQueryParams = {}): Promise<ExerciseCatalogResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('offset', String(Math.max(0, params.offset ?? 0)));
  searchParams.set('limit', String(Math.min(10, Math.max(1, params.limit ?? 10))));
  if (params.cursor) searchParams.set('cursor', params.cursor);
  if (params.q?.trim()) searchParams.set('q', params.q.trim());
  if (params.muscles?.trim()) searchParams.set('muscles', params.muscles.trim());
  if (params.equipment?.trim()) searchParams.set('equipment', params.equipment.trim());
  if (params.bodyParts?.trim()) searchParams.set('bodyParts', params.bodyParts.trim());
  if (params.difficulty?.trim()) searchParams.set('difficulty', params.difficulty.trim());
  if (params.category?.trim()) searchParams.set('category', params.category.trim());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  const url = `/api/exercise-catalog?${searchParams.toString()}`;
  return getCached(exerciseCache, exerciseInFlight, url, EXERCISE_CATALOG_CACHE_TTL_MS, () =>
    httpClient.get<ExerciseCatalogResponse>(url),
  );
}

export async function getExerciseCatalogExerciseById(exerciseId: string): Promise<ExerciseCatalogSingleResponse> {
  const url = `/api/exercise-catalog/${encodeURIComponent(exerciseId)}`;
  return getCached(detailCache, detailInFlight, url, EXERCISE_CATALOG_CACHE_TTL_MS, () =>
    httpClient.get<ExerciseCatalogSingleResponse>(url),
  );
}

export async function getExerciseCatalogFilterOptions(): Promise<ExerciseCatalogOptionsResponse> {
  if (optionsCache && optionsCache.expiresAt > Date.now()) return optionsCache.value;
  if (optionsInFlight) return optionsInFlight;

  optionsInFlight = httpClient
    .get<ExerciseCatalogOptionsResponse>('/api/exercise-catalog/options')
    .then(value => {
      optionsCache = { value, expiresAt: Date.now() + EXERCISE_CATALOG_OPTIONS_CACHE_TTL_MS };
      return value;
    })
    .finally(() => {
      optionsInFlight = null;
    });

  return optionsInFlight;
}

export async function searchExerciseCatalogExercises(
  query: string = '',
  filters: ExerciseCatalogFilters = {},
  offset: number = 0,
  limit: number = 25,
  fetchAll: boolean = false,
  cursor?: string | null,
): Promise<ExerciseCatalogResponse> {
  return getExerciseCatalogExercises({
    q: query,
    offset,
    limit: fetchAll ? 10 : Math.min(10, Math.max(1, limit)),
    cursor: cursor ?? undefined,
    bodyParts: filters.bodyParts?.join(','),
    equipment: filters.equipments?.join(','),
    muscles: filters.targetMuscles?.join(','),
    difficulty: filters.difficulty,
  });
}
