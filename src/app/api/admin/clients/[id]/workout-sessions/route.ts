import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { prisma } from '@/lib/prisma';

const ACTION_NAME = 'WORKOUT_SESSION_REVIEWED';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: clientId } = await params;
    if (!clientId) {
      return jsonWithCache({ error: 'Client id is required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, coachId: true },
    });

    if (!client || client.coachId !== actor.id) {
      return jsonWithCache({ error: 'Client not found for this coach' }, { status: 404 });
    }

    const sessions = await (prisma as any).workoutSession.findMany({
      where: { clientId },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        clientId: true,
        status: true,
        startedAt: true,
        completedAt: true,
        exerciseLogs: {
          select: {
            id: true,
          },
        },
      },
    });

    const reviewLogs = await prisma.auditLog.findMany({
      where: {
        actorId: actor.id,
        action: ACTION_NAME,
        targetUserId: {
          in: sessions.map((session: { id: string }) => session.id),
        },
      },
      select: {
        targetUserId: true,
        createdAt: true,
      },
    });

    const reviewedBySessionId = new Map<string, Date>();
    for (const log of reviewLogs) {
      if (!log.targetUserId) continue;
      const current = reviewedBySessionId.get(log.targetUserId);
      if (!current || log.createdAt < current) {
        reviewedBySessionId.set(log.targetUserId, log.createdAt);
      }
    }

    return jsonWithCache({
      sessions: sessions.map(
        (session: {
          id: string;
          clientId: string;
          status: string;
          startedAt: Date;
          completedAt: Date | null;
          exerciseLogs: Array<{ id: string }>;
        }) => ({
          id: session.id,
          clientId: session.clientId,
          status: session.status,
          startedAt: session.startedAt?.toISOString?.() ?? null,
          completedAt: session.completedAt?.toISOString?.() ?? null,
          summary: `${session.exerciseLogs.length} exercise${session.exerciseLogs.length === 1 ? '' : 's'}`,
          reviewed: reviewedBySessionId.has(session.id),
          reviewedAt: reviewedBySessionId.get(session.id)?.toISOString() ?? null,
        }),
      ),
      total: sessions.length,
    });
  } catch (error) {
    console.error('[ADMIN_WORKOUT_SESSIONS_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to fetch workout sessions' }, { status: 500 });
  }
}
