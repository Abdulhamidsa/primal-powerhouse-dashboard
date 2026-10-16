import { NextRequest, NextResponse } from 'next/server';
import { ServerHttpError } from '@/lib/http/client';
import { requireStaffActor } from '@/lib/api-auth';
import { getWorkoutXExercises } from '@/features/exercises/api/workoutX.server';
import { getLocalExerciseCatalogPage } from '@/features/exercises/server/localExerciseCatalog';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
};

function firstValue(value: string | null) {
  return value?.split(',').map(item => item.trim()).filter(Boolean)[0] ?? '';
}

function buildProviderParams(searchParams: URLSearchParams) {
  const params = new URLSearchParams({ lang: 'en', limit: String(Math.min(10, Math.max(1, Number(searchParams.get('limit') ?? '10') || 10))) });
  const q = (searchParams.get('q') ?? '').trim();
  if (q) params.set('name', q);

  const filters: Array<[string, string[]]> = [
    ['bodyPart', ['bodyPart', 'bodyParts']],
    ['equipment', ['equipment', 'equipments']],
    ['target', ['muscle', 'muscles', 'target', 'targetMuscles']],
    ['difficulty', ['difficulty']],
    ['category', ['category']],
  ];
  for (const [providerKey, aliases] of filters) {
    const value = aliases.map(alias => searchParams.get(alias)).find(Boolean);
    if (value) {
      params.set(providerKey, firstValue(value));
      break;
    }
  }

  params.set('offset', String(Math.max(0, Number(searchParams.get('offset') ?? '0') || 0)));
  return params;
}

function fallbackParams(searchParams: URLSearchParams) {
  return {
    offset: Math.max(0, Number(searchParams.get('offset') ?? '0') || 0),
    limit: Math.min(10, Math.max(1, Number(searchParams.get('limit') ?? '10') || 10)),
    q: (searchParams.get('q') ?? '').trim(),
    muscles: searchParams.get('muscle') ?? searchParams.get('muscles') ?? '',
    equipment: searchParams.get('equipment') ?? searchParams.get('equipments') ?? '',
    bodyParts: searchParams.get('bodyPart') ?? searchParams.get('bodyParts') ?? '',
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;
  const searchParams = request.nextUrl.searchParams;
  try {
    const result = await getWorkoutXExercises(buildProviderParams(searchParams));
    const limit = Number(buildProviderParams(searchParams).get('limit'));
    return NextResponse.json(
      {
        success: true,
        data: result.exercises,
        metadata: {
          totalExercises: result.total,
          totalPages: limit ? Math.ceil(result.total / limit) : 0,
          currentPage: limit ? Math.floor(result.offset / limit) : 0,
          previousPage: null,
          nextPage: result.nextOffset === null ? null : `/api/exercise-catalog?offset=${result.nextOffset}&limit=${limit}`,
          nextCursor: null,
          nextOffset: result.nextOffset,
          limit: result.limit,
          provider: 'workoutx',
          providerAvailable: true,
          fallback: false,
        },
      },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    try {
      const fallback = await getLocalExerciseCatalogPage({ ...fallbackParams(searchParams), coachId: auth.actor.id });
      const limit = fallbackParams(searchParams).limit;
      const headers = new Headers({ 'Cache-Control': 'private, max-age=60' });
      if (error instanceof ServerHttpError) {
        const retryAfter = error.headers.get('Retry-After');
        if (retryAfter) headers.set('Retry-After', retryAfter);
      }
      return NextResponse.json(
        {
          success: true,
          data: fallback.data,
          metadata: {
            totalExercises: fallback.total,
            totalPages: Math.ceil(fallback.total / limit),
            currentPage: Math.floor(fallbackParams(searchParams).offset / limit),
            previousPage: null,
            nextPage: fallbackParams(searchParams).offset + limit < fallback.total ? 'local' : null,
            nextCursor: null,
            nextOffset: fallbackParams(searchParams).offset + limit < fallback.total ? fallbackParams(searchParams).offset + limit : null,
            limit,
            provider: 'local',
            providerAvailable: false,
            fallback: true,
          },
        },
        { headers },
      );
    } catch {
      const status = error instanceof ServerHttpError ? error.status : 503;
      return NextResponse.json(
        { success: false, data: [], error: 'Exercise catalog is temporarily unavailable.' },
        { status, headers: CACHE_HEADERS },
      );
    }
  }
}
