import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const EXERCISE_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, stale-while-revalidate=604800, immutable',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = Math.min(25, Math.max(1, Number(searchParams.get('limit') ?? '25') || 25));
    const q = (searchParams.get('q') ?? '').trim();
    const muscles = (searchParams.get('muscles') ?? '').trim();
    const equipment = (searchParams.get('equipment') ?? '').trim();
    const bodyParts = (searchParams.get('bodyParts') ?? '').trim();
    const after = (searchParams.get('after') ?? '').trim();

    // Use free ExerciseDB API with fuzzy search support
    const params = new URLSearchParams({
      limit: String(limit),
    });

    // Add search/filter parameters - supports fuzzy matching
    if (q.length > 0) {
      params.set('name', q);
    }
    if (muscles.length > 0) {
      params.set('targetMuscles', muscles);
    }
    if (equipment.length > 0) {
      params.set('equipments', equipment);
    }
    if (bodyParts.length > 0) {
      params.set('bodyParts', bodyParts);
    }
    if (after.length > 0) {
      params.set('after', after);
    }

    const apiUrl = `https://oss.exercisedb.dev/api/v1/exercises?${params.toString()}`;

    const upstreamResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!upstreamResponse.ok) {
      console.error(`ExerciseDB API error: ${upstreamResponse.status} - ${upstreamResponse.statusText}`);
      return NextResponse.json(
        {
          success: false,
          error: `ExerciseDB request failed with status ${upstreamResponse.status}`,
        },
        { status: upstreamResponse.status, headers: EXERCISE_CACHE_HEADERS },
      );
    }

    const result = await upstreamResponse.json();

    // Transform response to our expected format
    const exercises = Array.isArray(result.data)
      ? result.data.map((ex: any) => ({
          exerciseId: ex.exerciseId || '',
          name: ex.name || '',
          gifUrl: ex.gifUrl || '',
          targetMuscles: ex.targetMuscles || [],
          bodyParts: ex.bodyParts || [],
          equipments: ex.equipments || [],
          secondaryMuscles: ex.secondaryMuscles || [],
          instructions: ex.instructions || [],
        }))
      : [];

    return NextResponse.json(
      {
        success: true,
        data: exercises,
        metadata: {
          limit,
          nextPage: result.meta?.nextCursor ? result.meta.nextCursor : null,
          hasMore: result.meta?.hasNextPage ?? false,
          total: result.meta?.total ?? exercises.length,
        },
      },
      { headers: EXERCISE_CACHE_HEADERS },
    );
  } catch (error) {
    console.error('Exercise API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch exercises',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: EXERCISE_CACHE_HEADERS },
    );
  }
}
