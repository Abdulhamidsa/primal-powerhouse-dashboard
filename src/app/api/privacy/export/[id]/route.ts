import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { hashDownloadToken } from '@/lib/privacy/export-utils';
import { privacyExportTokenQuerySchema } from '@/features/privacy/schemas/privacy.schema';
import { logAuditEvent } from '@/lib/audit';
import { rateLimit } from '@/lib/security/rate-limit';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { canAccessOwnExportJob } from '@/features/privacy/types/authorization.types';

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiAuth(request, 'client');
    if (!auth.ok) return auth.res;

    const ip = getClientIp(request);
    const limiter = rateLimit(`privacy-export-download:${auth.user.userId}:${ip}`, 10, 60_000);
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { id } = await params;
    const parsedToken = privacyExportTokenQuerySchema.safeParse({
      token: request.nextUrl.searchParams.get('token') ?? '',
    });

    if (!parsedToken.success) {
      return NextResponse.json({ error: 'Invalid download token' }, { status: 400 });
    }

    const job = await (prisma as any).privacyExportJob.findUnique({
      where: { id },
    });

    if (!job || !canAccessOwnExportJob({ jobClientId: job.clientId, requesterClientId: auth.user.userId })) {
      return NextResponse.json({ error: 'Export job not found' }, { status: 404 });
    }

    if (job.status !== 'READY') {
      return NextResponse.json({ error: 'Export job is not ready' }, { status: 409 });
    }

    const now = new Date();
    if (job.expiresAt < now) {
      await (prisma as any).privacyExportJob.update({
        where: { id: job.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'Export token expired' }, { status: 410 });
    }

    const tokenHash = hashDownloadToken(parsedToken.data.token);
    if (!job.downloadTokenHash || job.downloadTokenHash !== tokenHash) {
      return NextResponse.json({ error: 'Invalid download token' }, { status: 403 });
    }

    const oneTime = process.env.PRIVACY_EXPORT_ONE_TIME_DOWNLOAD === 'true';
    if (oneTime && job.downloadCount > 0) {
      return NextResponse.json({ error: 'Export already downloaded' }, { status: 410 });
    }

    await (prisma as any).privacyExportJob.update({
      where: { id: job.id },
      data: {
        downloadCount: { increment: 1 },
        downloadedAt: now,
      },
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorRole: 'client',
      targetUserId: auth.user.userId,
      action: 'privacy.export.downloaded',
      ip,
      userAgent: request.headers.get('user-agent'),
      metadata: { exportJobId: job.id },
    });

    const body = {
      data: job.payloadJson ? JSON.parse(job.payloadJson) : {},
      csv: job.csvBundleJson ? JSON.parse(job.csvBundleJson) : {},
    };

    return new NextResponse(JSON.stringify(body, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="privacy-export-${job.id}.json"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('[PRIVACY_EXPORT_DOWNLOAD_GET] Failed:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to download export' }, { status: 500 });
  }
}
