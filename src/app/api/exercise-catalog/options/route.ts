import { NextRequest, NextResponse } from 'next/server';
import { Equipment, MuscleGroup } from '@prisma/client';
import { getWorkoutXFilterOptions } from '@/features/exercises/api/workoutX.server';
import { requireStaffActor } from '@/lib/api-auth';

const labels = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => (typeof item === 'string' ? item : item && typeof item === 'object' && 'name' in item ? item.name : item && typeof item === 'object' && 'slug' in item ? item.slug : null))
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
};

export async function GET(request: NextRequest) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;
  try {
    const data = await getWorkoutXFilterOptions();
    return NextResponse.json(
      {
        success: true,
        data: {
          muscles: labels(data.muscles),
          equipments: labels(data.equipments),
          bodyParts: labels(data.bodyParts),
          categories: labels(data.categories),
          difficulties: labels(data.difficulties),
        },
      },
      { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } },
    );
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        muscles: Object.values(MuscleGroup),
        equipments: Object.values(Equipment),
        bodyParts: Object.values(MuscleGroup),
        categories: ['strength', 'cardio', 'mobility', 'stretching', 'plyometrics'],
        difficulties: ['beginner', 'intermediate', 'advanced'],
      },
      fallback: true,
    });
  }
}
