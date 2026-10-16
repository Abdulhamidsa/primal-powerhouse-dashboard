import { serverGetJson, ServerHttpError } from '@/lib/http/client';
import type { ExerciseCatalogExercise, ExerciseCatalogMedia } from '@/features/exercises/types/exerciseCatalog.types';

type WorkoutXListResponse = {
  total?: number;
  limit?: number;
  offset?: number;
  results?: unknown[];
};

export type WorkoutXAvailability = {
  enabled: boolean;
  reason?: 'missing_key' | 'missing_base_url';
};

export function getWorkoutXAvailability(): WorkoutXAvailability {
  if (!process.env.WORKOUTX_API_KEY?.trim()) return { enabled: false, reason: 'missing_key' };
  if (!process.env.WORKOUTX_API_BASE_URL?.trim()) return { enabled: false, reason: 'missing_base_url' };
  return { enabled: true };
}

function assertAvailable() {
  const availability = getWorkoutXAvailability();
  if (!availability.enabled) {
    throw new ServerHttpError('WorkoutX is not configured; using the local exercise library.', 503, new Headers());
  }
}

function getBaseUrl() {
  return process.env.WORKOUTX_API_BASE_URL!.trim().replace(/\/$/, '');
}

function getApiUrl(path: string, params?: URLSearchParams) {
  const url = new URL(`${getBaseUrl()}${path}`);
  if (params) url.search = params.toString();
  return url.toString();
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(item => {
      if (typeof item === 'string') return item.trim() ? [item.trim()] : [];
      if (!item || typeof item !== 'object') return [];
      const record = item as Record<string, unknown>;
      return [asString(record.group), asString(record.name), asString(record.value)].filter(Boolean);
    });
  }
  return asString(value) ? [asString(value)] : [];
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeMedia(value: unknown): ExerciseCatalogMedia {
  if (!value || typeof value !== 'object') return {};
  const media = value as Record<string, unknown>;
  const mp4 = asString(media.mp4);
  const poster = asString(media.poster);
  const gif = asString(media.gif);
  return {
    video: mp4 || poster ? { mp4: mp4 ? { '720p': mp4 } : null, webm: null, poster: poster || null } : null,
    gif: gif || null,
    photos: poster ? [poster] : [],
  };
}

export function mapWorkoutXExercise(input: Record<string, unknown>): ExerciseCatalogExercise {
  const media = normalizeMedia(input.media);
  const mp4 = media.video?.mp4?.['720p'] ?? null;
  const poster = media.video?.poster ?? null;
  const primaryMuscles = stringList(input.primaryMuscles);
  const target = stringList(input.target);
  const secondaryMuscles = stringList(input.secondaryMuscles);
  const bodyPart = asString(input.bodyPart);
  const equipment = asString(input.equipment);
  const exerciseId = asString(input.id);

  return {
    exerciseId,
    providerId: exerciseId,
    name: asString(input.name),
    gifUrl: media.gif ?? '',
    imageUrl: poster || media.gif || '',
    thumbnailUrl: poster || undefined,
    videoUrl: mp4 || undefined,
    videoUrls: mp4 ? [mp4] : [],
    targetMuscles: unique([...target, ...primaryMuscles]),
    target: target.length === 1 ? target[0] : target,
    bodyParts: bodyPart ? [bodyPart] : [],
    bodyPart: bodyPart || undefined,
    equipments: equipment ? [equipment] : [],
    equipment: equipment || undefined,
    secondaryMuscles: unique(secondaryMuscles),
    instructions: stringList(input.instructions),
    overview: asString(input.description),
    category: asString(input.category) || undefined,
    difficultyLevel: asString(input.difficulty) || undefined,
    force: asString(input.force) || undefined,
    mechanic: asString(input.mechanic) || undefined,
    photoUrls: poster ? [poster] : [],
  };
}

function providerHeaders() {
  return { 'X-WorkoutX-Key': process.env.WORKOUTX_API_KEY!.trim() };
}

export async function getWorkoutXExercises(params: URLSearchParams) {
  assertAvailable();
  const response = await serverGetJson<WorkoutXListResponse>(getApiUrl('/v2/exercises', params), {
    headers: providerHeaders(),
    next: { revalidate: 300 },
  });
  const exercises = (response.data.results ?? [])
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map(mapWorkoutXExercise);
  const total = Number(response.data.total ?? exercises.length);
  const limit = Number(response.data.limit ?? params.get('limit') ?? 10);
  const offset = Number(response.data.offset ?? params.get('offset') ?? 0);
  return {
    exercises,
    total,
    limit,
    offset,
    nextOffset: offset + exercises.length < total ? offset + limit : null,
    retryAfter: response.headers.get('Retry-After'),
  };
}

export async function getWorkoutXExercise(id: string) {
  assertAvailable();
  const response = await serverGetJson<Record<string, unknown>>(getApiUrl(`/v2/exercises/${encodeURIComponent(id)}`), {
    headers: providerHeaders(),
    next: { revalidate: 300 },
  });
  const data = response.data.data && typeof response.data.data === 'object' ? response.data.data : response.data;
  return mapWorkoutXExercise(data as Record<string, unknown>);
}

function optionLabels(value: unknown): string[] {
  if (Array.isArray(value)) {
    return unique(
      value.flatMap(item => {
        if (typeof item === 'string') return [item];
        if (!item || typeof item !== 'object') return [];
        const record = item as Record<string, unknown>;
        return [asString(record.name), asString(record.value), asString(record.slug), asString(record.group)].filter(Boolean);
      }),
    );
  }
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  for (const key of ['values', 'items', 'results', 'data', 'bodyParts', 'targets', 'equipment', 'categories', 'muscles']) {
    const labels = optionLabels(record[key]);
    if (labels.length) return labels;
  }
  return [];
}

async function getWorkoutXOptions(path: string) {
  const response = await serverGetJson<unknown>(getApiUrl(path), {
    headers: providerHeaders(),
    next: { revalidate: 86400 },
  });
  return optionLabels(response.data);
}

export async function getWorkoutXFilterOptions() {
  assertAvailable();
  const [bodyParts, equipments, muscles, categories, difficulties] = await Promise.all([
    getWorkoutXOptions('/v2/bodyParts'),
    getWorkoutXOptions('/v2/equipment'),
    getWorkoutXOptions('/v2/muscles'),
    getWorkoutXOptions('/v2/categories'),
    Promise.resolve(['beginner', 'intermediate', 'advanced']),
  ]);
  return { bodyParts, equipments, muscles, categories, difficulties };
}
