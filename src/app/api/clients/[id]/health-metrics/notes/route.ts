import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireClientResourceAccess } from '@/lib/api-auth';
import { logAuditEvent } from '@/lib/audit';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    const access = await requireClientResourceAccess(request, clientId);
    if (!access.ok) return access.res;

    const body = await request.json();
    const { notes } = body;

    if (!Array.isArray(notes)) {
      return jsonWithCache({ error: 'Notes must be an array' }, { status: 400 });
    }

    // Get the latest health metric record for this client
    const latestMetric = await prisma.healthMetric.findFirst({
      where: { clientId },
      orderBy: { recordedAt: 'desc' },
    });

    if (!latestMetric) {
      return jsonWithCache({ error: 'No health metrics found for this client' }, { status: 404 });
    }

    // Update the notes
    const updated = await prisma.healthMetric.update({
      where: { id: latestMetric.id },
      data: {
        notes: notes.join('\n'),
      },
      select: { notes: true },
    });

    await logAuditEvent({
      actorId: access.actor.id,
      actorRole: access.actor.role,
      targetUserId: clientId,
      action: 'client.health_metrics.notes.write',
      ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return jsonWithCache({
      success: true,
      notes: updated.notes?.split('\n') || [],
    });
  } catch (error) {
    console.error('Error saving health metric notes:', safeErrorMessage(error));
    return jsonWithCache(
      {
        error: 'Failed to save notes',
      },
      { status: 500 }
    );
  }
}
