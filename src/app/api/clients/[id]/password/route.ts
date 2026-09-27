import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getClientDisplayName } from '@/lib/client-display-name';
import { requireStaffActor } from '@/lib/api-auth';
import { AuthService } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { safeErrorMessage } from '@/lib/security/log-redaction';

function generateResetPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(10);
  let result = 'PP-';
  for (let i = 0; i < bytes.length; i += 1) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return `${result}!`;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireStaffActor(request);
    if (!auth.ok) return auth.res;

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, name: true, coachId: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (auth.actor.role === 'COACH' && client.coachId !== auth.actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const plainPassword = generateResetPassword();
    const hashedPassword = await AuthService.hashPassword(plainPassword);

    await prisma.client.update({
      where: { id: client.id },
      data: { password: hashedPassword },
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorRole: auth.user.type,
      targetUserId: client.id,
      action: 'client.password_reset',
      ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
      metadata: { clientEmail: client.email, clientName: getClientDisplayName(client) },
    });

    return NextResponse.json({
      email: client.email,
      username: client.username,
      password: plainPassword,
    });
  } catch (error) {
    console.error('POST /api/clients/[id]/password error:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to reset client password' }, { status: 500 });
  }
}
