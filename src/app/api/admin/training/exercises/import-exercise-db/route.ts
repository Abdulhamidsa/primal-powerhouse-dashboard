import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { exerciseService } from '@/features/training/services';
import { importExerciseDbExerciseSchema } from '@/features/training/schemas/exercise.schemas';

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const body = await request.json();
  const parsed = importExerciseDbExerciseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const exercise = await exerciseService.importExerciseDbExercise(auth.user.userId, parsed.data);
    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import exercise' },
      { status: 500 },
    );
  }
}
