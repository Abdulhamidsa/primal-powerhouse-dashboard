import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { exerciseService } from '@/features/training/services';
import { updateExerciseSchema } from '@/features/training/schemas/exercise.schemas';

type RouteContext = { params: Promise<{ exerciseId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { exerciseId } = await params;
  const body = await request.json();
  const parsed = updateExerciseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const exercise = await exerciseService.updateExercise(exerciseId, auth.user.userId, parsed.data);
    return NextResponse.json(exercise);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update exercise';
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  const { exerciseId } = await params;

  try {
    const exercise = await exerciseService.markExerciseInactive(exerciseId, auth.user.userId);
    return NextResponse.json(exercise);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete exercise';
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
