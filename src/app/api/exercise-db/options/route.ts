import { NextResponse } from 'next/server';

const EXERCISE_DB_BASE_URL = 'https://www.exercisedb.dev';

const EXERCISE_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, stale-while-revalidate=604800, immutable',
};

interface NamedOption {
  name: string;
}

async function fetchOptionList(path: string): Promise<string[]> {
  const response = await fetch(`${EXERCISE_DB_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`ExerciseDB options request failed (${response.status}) for ${path}`);
  }

  const payload = (await response.json()) as { success?: boolean; data?: NamedOption[] };
  return (payload.data ?? []).map(item => item.name).filter(Boolean);
}

export async function GET() {
  try {
    const [muscles, equipments, bodyParts] = await Promise.all([
      fetchOptionList('/api/v1/muscles'),
      fetchOptionList('/api/v1/equipments'),
      fetchOptionList('/api/v1/bodyparts'),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          muscles,
          equipments,
          bodyParts,
        },
      },
      { headers: EXERCISE_CACHE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch ExerciseDB filter options',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: EXERCISE_CACHE_HEADERS }
    );
  }
}
