import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { trainingSessionService } from '@/features/training/services';
import { completeTrainingSessionSchema } from '@/features/training/schemas/session.schemas';

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const { sessionId } = await params;
  const session = await trainingSessionService.getSession(sessionId, auth.user.userId);
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(session);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const { sessionId } = await params;
  const body = await request.json();
  const parsed = completeTrainingSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const session = await trainingSessionService.completeSession(sessionId, auth.user.userId, parsed.data);
    return NextResponse.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to complete session';
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}