import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { encryptField, decryptOrFallback } from '@/lib/security/field-crypto';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { z } from 'zod';

function isMissingEncryptionKeyError(error: unknown): boolean {
  return String(error).includes('Field encryption key is not configured');
}

function tryEncrypt(value: string): string | null {
  try {
    return encryptField(value, 'credential-password');
  } catch (error) {
    if (isMissingEncryptionKeyError(error)) return null;
    throw error;
  }
}

function tryDecrypt(value: string | null): string | null {
  if (!value) return null;
  try {
    return decryptOrFallback(value, 'credential-password');
  } catch (error) {
    if (isMissingEncryptionKeyError(error)) return null;
    throw error;
  }
}

const patchSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().max(30).nullable().optional(),
    status: z.enum(['CONTACTED', 'HAD_MEETING', 'MADE_DEAL', 'CONVERTED']).optional(),
    subscriptionType: z.string().trim().max(100).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    convertedClientId: z.string().optional(),
    credentialEmail: z.string().email().optional(),
    credentialPassword: z.string().min(1).optional(),
  })
  .strict()
  .refine(v => Object.keys(v).length > 0, { message: 'Provide at least one field' });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const existing = await (prisma as any).clientLead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const { credentialPassword, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };

    if (credentialPassword) {
      updateData.credentialPasswordEncrypted = tryEncrypt(credentialPassword);
    }

    const updated = await (prisma as any).clientLead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      status: updated.status,
      subscriptionType: updated.subscriptionType,
      notes: updated.notes,
      convertedClientId: updated.convertedClientId,
      credentialEmail: updated.credentialEmail,
      hasCredentials: Boolean(updated.credentialEmail && updated.credentialPasswordEncrypted),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('PATCH /api/client-leads/[id] error:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const { id } = await params;
    const lead = await (prisma as any).clientLead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const decryptedPassword = tryDecrypt(lead.credentialPasswordEncrypted);

    return NextResponse.json({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      subscriptionType: lead.subscriptionType,
      notes: lead.notes,
      convertedClientId: lead.convertedClientId,
      credentialEmail: lead.credentialEmail,
      credentialPassword: decryptedPassword,
      hasCredentials: Boolean(lead.credentialEmail && lead.credentialPasswordEncrypted),
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    });
  } catch (error) {
    console.error('GET /api/client-leads/[id] error:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const { id } = await params;
    const existing = await (prisma as any).clientLead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await (prisma as any).clientLead.delete({ where: { id } });
    return NextResponse.json({ message: 'Lead deleted' });
  } catch (error) {
    console.error('DELETE /api/client-leads/[id] error:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
