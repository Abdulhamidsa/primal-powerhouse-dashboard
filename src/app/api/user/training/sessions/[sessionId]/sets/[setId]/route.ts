import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { trainingSessionService } from '@/features/training/services';
import { updateSetSchema } from '@/features/training/schemas/session.schemas';

type RouteContext = { params: Promise<{ sessionId: string; setId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const { sessionId, setId } = await params;
  const body = await request.json();
  const parsed = updateSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const set = await trainingSessionService.updateSet(sessionId, auth.user.userId, setId, parsed.data);
    return NextResponse.json(set);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update set';
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
