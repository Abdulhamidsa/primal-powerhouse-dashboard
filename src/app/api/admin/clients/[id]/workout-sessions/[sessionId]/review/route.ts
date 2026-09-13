import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { prisma } from '@/lib/prisma';

const ACTION_NAME = 'WORKOUT_SESSION_REVIEWED';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  try {
    const { error, user } = await requireAuth(request, 'admin');
    if (error || !user || user.type !== 'admin') {
      return jsonWithCache({ error: 'Not authorized' }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, role: true },
    });

    if (!actor || actor.role !== 'COACH') {
      return jsonWithCache({ error: 'Coach access required' }, { status: 403 });
    }

    const { id: clientId, sessionId } = await params;
    if (!clientId || !sessionId) {
      return jsonWithCache({ error: 'Client id and session id are required' }, { status: 400 });
    }

    const session = await (prisma as any).workoutSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        clientId: true,
        client: {
          select: {
            coachId: true,
          },
        },
      },
    });

    if (!session || session.clientId !== clientId || session.client?.coachId !== actor.id) {
      return jsonWithCache({ error: 'Workout session not found for this coach' }, { status: 404 });
    }

    const existing = await prisma.auditLog.findFirst({
      where: {
        actorId: actor.id,
        action: ACTION_NAME,
        targetUserId: sessionId,
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: 'COACH',
          targetUserId: sessionId,
          action: ACTION_NAME,
          metadata: JSON.stringify({ clientId, sessionId }),
        },
      });
    }

    return jsonWithCache({ success: true as const });
  } catch (error) {
    console.error('[ADMIN_WORKOUT_SESSION_REVIEW_POST] Failed:', error);
    return jsonWithCache({ error: 'Failed to mark workout session as reviewed' }, { status: 500 });
  }
}
