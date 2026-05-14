import { NextRequest, NextResponse } from 'next/server';

/**
 * Compatibility route: map old /rapidapi callers to the previous
 * ExerciseDB-backed endpoint that now also merges saved local exercises.
 */
export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams;
  const mapped = new URLSearchParams();

  const offset = src.get('offset') ?? '0';
  const limit = src.get('limit') ?? '25';

  mapped.set('offset', offset);
  mapped.set('limit', limit);

  const q = (src.get('q') ?? '').trim();
  const bodyParts = (src.get('bodyParts') ?? '').trim();
  const equipments = (src.get('equipments') ?? '').trim();
  const targetMuscles = (src.get('targetMuscles') ?? '').trim();

  if (q) mapped.set('q', q);
  if (bodyParts) mapped.set('bodyParts', bodyParts);
  if (equipments) mapped.set('equipment', equipments);
  if (targetMuscles) mapped.set('muscles', targetMuscles);

  // fetchAll is retained only for backward compatibility and mapped to a larger limit.
  if ((src.get('fetchAll') ?? '').length > 0) {
    mapped.set('limit', '200');
  }

  const target = new URL('/api/exercise-db/exercises', request.url);
  target.search = mapped.toString();

  return NextResponse.redirect(target, 307);
}
