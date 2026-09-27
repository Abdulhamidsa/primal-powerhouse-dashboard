import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffActor } from '@/lib/api-auth';
import { decryptOrFallback } from '@/lib/security/field-crypto';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { logAuditEvent } from '@/lib/audit';

function tryDecrypt(value: string | null): string | null {
  if (!value) return null;
  try {
    return decryptOrFallback(value, 'credential-password');
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireStaffActor(request);
    if (!auth.ok) return auth.res;

    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true, coachId: true },
    });

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    if (auth.actor.role === 'COACH' && client.coachId !== auth.actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const lead = await (prisma as any).clientLead.findFirst({
      where: { convertedClientId: id },
    });

    if (!lead || !lead.credentialEmail || !lead.credentialPasswordEncrypted) {
      return NextResponse.json({ error: 'No credentials found for this client' }, { status: 404 });
    }

    const password = tryDecrypt(lead.credentialPasswordEncrypted);

    await logAuditEvent({
      actorId: auth.actor.id,
      actorRole: auth.actor.role,
      targetUserId: id,
      action: 'client.credentials.read',
      ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      email: lead.credentialEmail,
      password,
    });
  } catch (error) {
    console.error('GET /api/clients/[id]/credentials error:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}
