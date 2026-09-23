import { NextRequest, NextResponse } from 'next/server';
import { requireRecentClientAuth } from '@/lib/security/recent-auth';
import { assertSameOrigin } from '@/lib/security/csrf';
import { rateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { privacyDeleteRequestSchema } from '@/features/privacy/schemas/privacy.schema';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { AuthService } from '@/lib/auth';
import { requestClientDeletion } from '@/lib/privacy/request-client-deletion';

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

function deletionRequestPayload(request: {
  id: string;
  status: string;
  requestedAt: Date;
  scheduledHardDeleteAt: Date;
  gracePeriodDays: number;
}) {
  return {
    id: request.id,
    status: request.status,
    requestedAt: request.requestedAt.toISOString(),
    scheduledHardDeleteAt: request.scheduledHardDeleteAt.toISOString(),
    gracePeriodDays: request.gracePeriodDays,
  };
}

export async function POST(request: NextRequest) {
  try {
    const csrf = await assertSameOrigin(request);
    if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

    const auth = await requireRecentClientAuth(request);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const ip = getClientIp(request);
    const limiter = rateLimit(`privacy-delete:${auth.user.userId}:${ip}`, 5, 60_000);
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const parsed = privacyDeleteRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid deletion request payload' }, { status: 400 });
    }

    const deletionRequest = await requestClientDeletion(auth.user.userId, parsed.data.reason);

    await logAuditEvent({
      actorId: auth.user.userId,
      actorRole: 'client',
      targetUserId: auth.user.userId,
      action: 'privacy.deletion.requested',
      ip,
      userAgent: request.headers.get('user-agent'),
      metadata: { gracePeriodDays: deletionRequest.gracePeriodDays, deletionRequestId: deletionRequest.id },
    });

    const response = NextResponse.json({
      success: true,
      request: deletionRequestPayload(deletionRequest),
    });

    AuthService.clearAuthCookieOnResponse(response, {
      requestHost: request.headers.get('host') ?? undefined,
    });

    return response;
  } catch (error) {
    console.error('[PRIVACY_DELETE_POST] Failed:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to process deletion request' }, { status: 500 });
  }
}
