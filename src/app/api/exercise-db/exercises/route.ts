import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const EXERCISE_DB_BASE_URL = 'https://www.exercisedb.dev';

const EXERCISE_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, stale-while-revalidate=604800, immutable',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const offset = Math.max(0, Number(searchParams.get('offset') ?? '0') || 0);
    const limit = Math.min(25, Math.max(1, Number(searchParams.get('limit') ?? '25') || 25));
    const q = (searchParams.get('q') ?? '').trim();
    const muscles = (searchParams.get('muscles') ?? '').trim();
    const equipment = (searchParams.get('equipment') ?? '').trim();
    const bodyParts = (searchParams.get('bodyParts') ?? '').trim();
    const sortBy = (searchParams.get('sortBy') ?? '').trim();
    const sortOrder = (searchParams.get('sortOrder') ?? '').trim();

    const hasAdvancedFilter = muscles.length > 0 || equipment.length > 0 || bodyParts.length > 0;

    const upstreamParams = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });

    if (hasAdvancedFilter) {
      if (q.length > 0) {
        upstreamParams.set('search', q);
      }
      if (muscles.length > 0) {
        upstreamParams.set('muscles', muscles);
      }
      if (equipment.length > 0) {
        upstreamParams.set('equipment', equipment);
      }
      if (bodyParts.length > 0) {
        upstreamParams.set('bodyParts', bodyParts);
      }
    } else if (q.length > 0) {
      upstreamParams.set('q', q);
    }

    if (sortBy.length > 0) {
      upstreamParams.set('sortBy', sortBy);
    }
    if (sortOrder.length > 0) {
      upstreamParams.set('sortOrder', sortOrder);
    }

    const endpoint = hasAdvancedFilter
      ? '/api/v1/exercises/filter'
      : q.length > 0
        ? '/api/v1/exercises/search'
        : '/api/v1/exercises';
    const upstreamUrl = `${EXERCISE_DB_BASE_URL}${endpoint}?${upstreamParams.toString()}`;

    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `ExerciseDB request failed with status ${upstreamResponse.status}`,
        },
        { status: upstreamResponse.status, headers: EXERCISE_CACHE_HEADERS }
      );
    }

    const payload = await upstreamResponse.json();
    return NextResponse.json(payload, { headers: EXERCISE_CACHE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch exercises from ExerciseDB',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: EXERCISE_CACHE_HEADERS }
    );
  }
}
