import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireStaffActor } from '@/lib/api-auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createClientSchema } from '@/features/client-creation/schemas/clientCreation.schema';
import { ClientStatus } from '@prisma/client';
import {
  clientListSelect,
  toClientCreatedResponse,
  toClientListResponse,
} from '@/lib/client-response';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { assertAgeDeclaration, recordConfiguredAgeDeclaration } from '@/lib/privacy/age-policy';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStaffActor(request);
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(request.url);
    const legacyArchived = searchParams.get('archived') === 'true';
    const requestedStatus = searchParams.get('status');
    const includeCounts = searchParams.get('includeCounts') === 'true';
    const status: ClientStatus = legacyArchived
      ? ClientStatus.ARCHIVED
      : requestedStatus && ['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(requestedStatus)
        ? (requestedStatus as ClientStatus)
        : ClientStatus.ACTIVE;
    const statusFilter = status === ClientStatus.INACTIVE ? { in: [ClientStatus.INACTIVE, ClientStatus.PAUSED] } : status;
    const starterClientId = process.env.SELF_SERVICE_STARTER_CLIENT_ID?.trim();
    const clients = await prisma.client.findMany({
      where: {
        status: statusFilter,
        ...(auth.actor.role === 'COACH' ? { coachId: auth.actor.id } : {}),
      },
      select: clientListSelect,
      orderBy: { createdAt: 'desc' },
    });

    const parsedClients = clients.map(client =>
      toClientListResponse(
        client,
        Boolean((starterClientId && client.id === starterClientId) || client.email === 'starter-template@primal.local'),
      ),
    );

    if (includeCounts) {
      const groupedCounts = await prisma.client.groupBy({
        by: ['status'],
        where: auth.actor.role === 'COACH' ? { coachId: auth.actor.id } : undefined,
        _count: { _all: true },
      });
      const counts = { ACTIVE: 0, INACTIVE: 0, ARCHIVED: 0 };
      for (const group of groupedCounts) {
        if (group.status === 'PAUSED') counts.INACTIVE += group._count._all;
        else if (group.status in counts) counts[group.status as keyof typeof counts] += group._count._all;
      }
      return jsonWithCache({ clients: parsedClients, counts });
    }

    return jsonWithCache(parsedClients);
  } catch (error) {
    console.error('Error fetching clients:', safeErrorMessage(error));
    return jsonWithCache({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  try {
    const body = await request.json();
    const parsed = createClientSchema.safeParse(body);

    if (!parsed.success) {
      return jsonWithCache(
        {
          error: 'Invalid client payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { coachId, password, progressPhotos, sessionsCompleted, status, ageDeclared, ...clientData } = parsed.data;

    assertAgeDeclaration(ageDeclared);

    // Default to the authenticated user as the coach
    const userId = coachId || auth.user.userId;

    // Check for existing client with same email
    const existingClient = await prisma.client.findUnique({
      where: { email: clientData.email },
    });

    if (existingClient) {
      return jsonWithCache({ error: 'A client with this email already exists' }, { status: 400 });
    }

    // Prepare password (optional: generate if not provided)
    const generatePassword = () =>
      `PP-${crypto
        .randomBytes(9)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 12)}!`;
    const plainPassword = (password && String(password).trim()) || generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Prepare data for Prisma
    const clientToCreate = {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone || null,
      avatar: clientData.avatar || null,
      status: status || 'ACTIVE',
      currentWeight: clientData.currentWeight || null,
      targetWeight: clientData.targetWeight || null,
      height: clientData.height || null,
      age: clientData.age || null,
      gender: clientData.gender || null,
      activityLevel: clientData.activityLevel || null,
      password: hashedPassword,
      accessMode: 'COACHING' as const,
      notes: clientData.notes || null,
      sessionsCompleted: sessionsCompleted || 0,
      coachId: userId,
      dietaryRestrictions: JSON.stringify(clientData.dietaryRestrictions || []),
      goals: JSON.stringify(clientData.goals || []),
      progressPhotos: JSON.stringify(progressPhotos || []),
    };

    const client = await prisma.$transaction(async tx => {
      const created = await tx.client.create({
        data: clientToCreate,
      });
      await recordConfiguredAgeDeclaration({
        clientId: created.id,
        declared: ageDeclared,
        source: 'admin-client-create',
        platform: 'web',
        tx,
      });
      return created;
    });

    return jsonWithCache(
      {
        client: toClientCreatedResponse(client),
        credentials: {
          email: client.email,
          password: plainPassword,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'AGE_DECLARATION_REQUIRED') {
      return jsonWithCache({ error: 'Age declaration is required to create a client' }, { status: 422 });
    }
    return jsonWithCache(
      {
        error: 'Failed to create client',
      },
      { status: 500 }
    );
  }
}
