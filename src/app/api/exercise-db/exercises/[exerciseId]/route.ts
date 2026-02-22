import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const EXERCISE_DB_BASE_URL = 'https://www.exercisedb.dev';

const EXERCISE_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, stale-while-revalidate=604800, immutable',
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ exerciseId: string }> }) {
  try {
    const { exerciseId } = await params;

    if (!exerciseId || exerciseId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'exerciseId is required' },
        { status: 400, headers: EXERCISE_CACHE_HEADERS }
      );
    }

    const upstreamUrl = `${EXERCISE_DB_BASE_URL}/api/v1/exercises/${encodeURIComponent(exerciseId)}`;
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
        error: 'Failed to fetch exercise details from ExerciseDB',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: EXERCISE_CACHE_HEADERS }
    );
  }
}
