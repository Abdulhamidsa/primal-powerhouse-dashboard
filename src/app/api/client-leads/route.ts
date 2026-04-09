import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { addClientLeadSchema } from '@/features/client-leads/schemas/clientLead.schemas';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function GET(request: NextRequest) {
  try {
    const auth = requireApiAuth(request, 'admin');
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
    const auth = requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const body = await request.json();
    const parsed = addClientLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const { name, email, phone, subscriptionType, notes } = parsed.data;

    const lead = await (prisma as any).clientLead.create({
      data: {
        id: crypto.randomUUID().replace(/-/g, '').slice(0, 25),
        name,
        email,
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
