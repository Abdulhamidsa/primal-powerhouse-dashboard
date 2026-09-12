import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { trainingSessionService } from '@/features/training/services';
import { startTrainingSessionSchema } from '@/features/training/schemas/session.schemas';

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const body = await request.json();
  const parsed = startTrainingSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const session = await trainingSessionService.startSession(auth.user.userId, parsed.data);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start session';
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
