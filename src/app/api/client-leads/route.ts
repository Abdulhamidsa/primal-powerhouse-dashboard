import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { addClientLeadSchema } from '@/features/client-leads/schemas/clientLead.schemas';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const leads = await (prisma as any).clientLead.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const shaped = leads.map((lead: any) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      subscriptionType: lead.subscriptionType,
      notes: lead.notes,
      convertedClientId: lead.convertedClientId,
      credentialEmail: lead.credentialEmail,
      hasCredentials: Boolean(lead.credentialEmail && lead.credentialPasswordEncrypted),
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error('GET /api/client-leads error:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const body = await request.json();
    const parsed = addClientLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const { name, email, phone, subscriptionType, notes } = parsed.data;

    // Auto-generate email if not provided
    let resolvedEmail = email?.trim() || null;
    if (!resolvedEmail) {
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .join('.');

      let generated: string | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const suffix = String(Math.floor(1000 + Math.random() * 9000));
        const candidate = `${slug}.${suffix}@primalpowerhouse.com`;
        const [inLeads, inClients] = await Promise.all([
          (prisma as any).clientLead.findFirst({ where: { email: candidate } }),
          prisma.client.findUnique({ where: { email: candidate } }),
        ]);
        if (!inLeads && !inClients) {
          generated = candidate;
          break;
        }
      }
      if (!generated) {
        return NextResponse.json({ error: 'Could not generate a unique email. Please provide one manually.' }, { status: 409 });
      }
      resolvedEmail = generated;
    }

    const lead = await (prisma as any).clientLead.create({
      data: {
        id: crypto.randomUUID().replace(/-/g, '').slice(0, 25),
        name,
        email: resolvedEmail,
        phone: phone || null,
        subscriptionType: subscriptionType || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(
      {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        subscriptionType: lead.subscriptionType,
        notes: lead.notes,
        convertedClientId: null,
        credentialEmail: null,
        hasCredentials: false,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/client-leads error:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
