import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Use previous free ExerciseDB API and merge it with locally saved exercises.
    // We pull a larger page and apply local offset/limit after merging.
    const upstreamLimit = Math.min(200, Math.max(limit, offset + limit));
    const params = new URLSearchParams({
      limit: String(upstreamLimit),
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

    // Transform upstream response to our expected format
    const apiExercises = Array.isArray(result.data)
      ? result.data.map((ex: any) => ({
          exerciseId: ex.exerciseId || '',
          name: ex.name || '',
          gifUrl: ex.gifUrl || '',
          imageUrl: ex.imageUrl || '',
          imageUrls: ex.imageUrls || {},
          videoUrl: ex.videoUrl || '',
          targetMuscles: ex.targetMuscles || [],
          bodyParts: ex.bodyParts || [],
          equipments: ex.equipments || [],
          secondaryMuscles: ex.secondaryMuscles || [],
          instructions: ex.instructions || [],
          exerciseTips: ex.exerciseTips || [],
          variations: ex.variations || [],
          keywords: ex.keywords || [],
          overview: ex.overview || '',
          difficultyLevel: ex.difficultyLevel || '',
          relatedExerciseIds: ex.relatedExerciseIds || [],
        }))
      : [];

    const splitFilters = (value: string) =>
      value
        .split(',')
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => v.toUpperCase());

    const musclesFilter = splitFilters(muscles);
    const equipmentFilter = splitFilters(equipment);
    const bodyPartsFilter = splitFilters(bodyParts);
    const qUpper = q.toUpperCase();

    const localExercisesRaw = await prisma.exercise.findMany({
      orderBy: { name: 'asc' },
    });

    const localExercises = localExercisesRaw
      .filter(ex => {
        const localBodyPart = ex.muscleGroup.replace(/_/g, ' ').toUpperCase();
        const localMuscle = ex.muscleGroup.replace(/_/g, ' ').toUpperCase();
        const localEquipment = (ex.equipment ?? '').replace(/_/g, ' ').toUpperCase();
        const searchable = [ex.name, ex.description ?? '', localBodyPart, localMuscle, localEquipment]
          .join(' ')
          .toUpperCase();

        if (qUpper && !searchable.includes(qUpper)) return false;
        if (musclesFilter.length > 0 && !musclesFilter.some(item => localMuscle.includes(item))) return false;
        if (equipmentFilter.length > 0 && !equipmentFilter.some(item => localEquipment.includes(item))) return false;
        if (bodyPartsFilter.length > 0 && !bodyPartsFilter.some(item => localBodyPart.includes(item))) return false;
        return true;
      })
      .map(ex => ({
        exerciseId: ex.id,
        name: ex.name,
        gifUrl: ex.imageUrl || '',
        imageUrl: ex.imageUrl || '',
        imageUrls: {},
        videoUrl: ex.videoUrl || '',
        targetMuscles: [ex.muscleGroup.replace(/_/g, ' ').toUpperCase()],
        bodyParts: [ex.muscleGroup.replace(/_/g, ' ').toUpperCase()],
        equipments: ex.equipment ? [ex.equipment.replace(/_/g, ' ').toUpperCase()] : [],
        secondaryMuscles: ex.muscleGroupSecondary ? [ex.muscleGroupSecondary.replace(/_/g, ' ').toUpperCase()] : [],
        instructions: ex.instructions ? ex.instructions.split('\n').filter(Boolean) : [],
        exerciseTips: [],
        variations: [],
        keywords: [ex.name, ex.description ?? ''].filter(Boolean),
        overview: ex.description ?? '',
        difficultyLevel: '',
        relatedExerciseIds: [],
      }));

    let mergedExercises = [...apiExercises, ...localExercises];

    if (qUpper.length > 0) {
      const scoreFor = (ex: any) => {
        let score = 0;
        const name = (ex.name || '').toUpperCase();
        if (name.includes(qUpper)) score += 100;
        if (Array.isArray(ex.keywords) && ex.keywords.some((k: any) => String(k).toUpperCase().includes(qUpper)))
          score += 20;
        if (
          Array.isArray(ex.targetMuscles) &&
          ex.targetMuscles.some((m: any) => String(m).toUpperCase().includes(qUpper))
        )
          score += 10;
        if (Array.isArray(ex.bodyParts) && ex.bodyParts.some((b: any) => String(b).toUpperCase().includes(qUpper)))
          score += 5;
        return score;
      };

      mergedExercises = mergedExercises
        .map((ex: any) => ({ ex, score: scoreFor(ex) }))
        .sort((a: { ex: any; score: number }, b: { ex: any; score: number }) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.ex.name.localeCompare(b.ex.name);
        })
        .map((item: { ex: any; score: number }) => item.ex);
    }

    const total = mergedExercises.length;
    const paged = mergedExercises.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    const hasMore = nextOffset < total;

    return NextResponse.json(
      {
        success: true,
        data: paged,
        metadata: {
          offset,
          limit,
          nextPage: hasMore ? String(nextOffset) : null,
          hasMore,
          total,
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
