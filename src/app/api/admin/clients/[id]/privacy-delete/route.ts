import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { logAuditEvent } from '@/lib/audit';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { adminClientDeletionSchema } from '@/features/admin-clients-dashboard/schemas/adminClientDeletion.schema';
import { requestClientDeletion } from '@/lib/privacy/request-client-deletion';

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth.res;

  try {
    const { id } = await params;
    const parsed = adminClientDeletionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Type DELETE to confirm client deletion.' }, { status: 400 });

    const actor = await prisma.user.findUnique({ where: { id: auth.user.userId }, select: { id: true, role: true } });
    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'COACH')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const target = await prisma.client.findUnique({
      where: { id },
      select: { id: true, email: true, coachId: true },
    });
    if (!target) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    if (actor.role === 'COACH' && target.coachId !== actor.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const isSystemTemplate = Boolean(
      (process.env.SELF_SERVICE_STARTER_CLIENT_ID?.trim() && id === process.env.SELF_SERVICE_STARTER_CLIENT_ID.trim()) ||
        target.email === 'starter-template@primal.local',
    );
    if (isSystemTemplate) return NextResponse.json({ error: 'System template clients cannot be deleted.' }, { status: 400 });

    const deletionRequest = await requestClientDeletion(id, 'Admin requested account deletion');
    const ip = getClientIp(request);
    await logAuditEvent({
      actorId: actor.id,
      actorRole: actor.role.toLowerCase(),
      targetUserId: id,
      action: 'privacy.deletion.requested_by_admin',
      ip,
      userAgent: request.headers.get('user-agent'),
      metadata: {
        deletionRequestId: deletionRequest.id,
        scheduledHardDeleteAt: deletionRequest.scheduledHardDeleteAt.toISOString(),
        gracePeriodDays: deletionRequest.gracePeriodDays,
      },
    });

    return NextResponse.json({
      success: true,
      request: {
        id: deletionRequest.id,
        status: deletionRequest.status,
        scheduledHardDeleteAt: deletionRequest.scheduledHardDeleteAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[ADMIN_CLIENT_PRIVACY_DELETE] Failed:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
