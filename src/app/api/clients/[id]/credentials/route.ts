import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { decryptOrFallback } from '@/lib/security/field-crypto';
import { safeErrorMessage } from '@/lib/security/log-redaction';

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
    const auth = await requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const { id } = await params;

    const lead = await (prisma as any).clientLead.findFirst({
      where: { convertedClientId: id },
    });

    if (!lead || !lead.credentialEmail || !lead.credentialPasswordEncrypted) {
      return NextResponse.json({ error: 'No credentials found for this client' }, { status: 404 });
    }

    const password = tryDecrypt(lead.credentialPasswordEncrypted);

    return NextResponse.json({
      email: lead.credentialEmail,
      password,
    });
  } catch (error) {
    console.error('GET /api/clients/[id]/credentials error:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}
