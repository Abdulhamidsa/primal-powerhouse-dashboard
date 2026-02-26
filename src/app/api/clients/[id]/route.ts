import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { decryptOrFallback, encryptField } from '@/lib/security/field-crypto';
import { safeErrorMessage } from '@/lib/security/log-redaction';

function shouldKeepPlaintext(): boolean {
  return process.env.PRIVACY_ENCRYPTION_STRICT !== 'true';
}

function normalizeJsonString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const { id } = await params;

    // Check if the client ID is valid
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('API: Invalid client ID provided:', id);
      return NextResponse.json({ error: 'Invalid client ID provided' }, { status: 400 });
    }

    // Try to find the client
    const client = await (prisma as any).client.findUnique({
      where: { id },
    });

    if (!client) {
      console.error(`API: Client not found with ID: ${id}`);
      return NextResponse.json({ error: `Client not found with ID: ${id}` }, { status: 404 });
    }

    // Parse JSON fields
    try {
      if (
        (!client.notesEncrypted && client.notes) ||
        (!client.goalsEncrypted && client.goals) ||
        (!client.dietaryRestrictionsEncrypted && client.dietaryRestrictions) ||
        (!client.phoneEncrypted && client.phone) ||
        (!client.motivationalMessageEncrypted && client.motivationalMessage)
      ) {
        await (prisma as any).client.update({
          where: { id: client.id },
          data: {
            notesEncrypted: client.notes ? encryptField(client.notes, `client:${client.id}:notes`) : null,
            goalsEncrypted: client.goals ? encryptField(client.goals, `client:${client.id}:goals`) : null,
            dietaryRestrictionsEncrypted: client.dietaryRestrictions
              ? encryptField(client.dietaryRestrictions, `client:${client.id}:dietaryRestrictions`)
              : null,
            phoneEncrypted: client.phone ? encryptField(client.phone, `client:${client.id}:phone`) : null,
            motivationalMessageEncrypted: client.motivationalMessage
              ? encryptField(client.motivationalMessage, `client:${client.id}:motivationalMessage`)
              : null,
          },
        });
      }

      const goalsRaw = decryptOrFallback(client.goalsEncrypted, `client:${client.id}:goals`) ?? client.goals;
      const dietaryRaw =
        decryptOrFallback(client.dietaryRestrictionsEncrypted, `client:${client.id}:dietaryRestrictions`) ??
        client.dietaryRestrictions;

      const clientData = {
        ...client,
        phone: decryptOrFallback(client.phoneEncrypted, `client:${client.id}:phone`) ?? client.phone,
        notes: decryptOrFallback(client.notesEncrypted, `client:${client.id}:notes`) ?? client.notes,
        motivationalMessage:
          decryptOrFallback(client.motivationalMessageEncrypted, `client:${client.id}:motivationalMessage`) ??
          client.motivationalMessage,
        goals: goalsRaw ? JSON.parse(goalsRaw) : [],
        dietaryRestrictions: dietaryRaw ? JSON.parse(dietaryRaw) : [],
        progressPhotos: client.progressPhotos ? JSON.parse(client.progressPhotos) : [],
      };

      return jsonWithCache(clientData);
    } catch (parseError) {
      console.error('API: Error parsing client JSON fields:', safeErrorMessage(parseError));
      return NextResponse.json(
        {
          error: 'Error parsing client data',
          details: safeErrorMessage(parseError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API: Error fetching client:', safeErrorMessage(error));
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: safeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const { id } = await params;
    const body = await request.json();

    const goalsRaw = normalizeJsonString(body.goals);
    const dietaryRaw = normalizeJsonString(body.dietaryRestrictions);
    const notesRaw = typeof body.notes === 'string' ? body.notes : null;
    const motivationalRaw = typeof body.motivationalMessage === 'string' ? body.motivationalMessage : null;
    const phoneRaw = typeof body.phone === 'string' ? body.phone : null;

    // Convert arrays to JSON strings for SQLite storage
    const updateData = {
      ...body,
      goals: shouldKeepPlaintext() ? goalsRaw : null,
      dietaryRestrictions: shouldKeepPlaintext() ? dietaryRaw : null,
      progressPhotos: body.progressPhotos ? JSON.stringify(body.progressPhotos) : undefined,
      notes: shouldKeepPlaintext() ? notesRaw : null,
      motivationalMessage: shouldKeepPlaintext() ? motivationalRaw : null,
      phone: shouldKeepPlaintext() ? phoneRaw : null,
      goalsEncrypted: goalsRaw ? encryptField(goalsRaw, `client:${id}:goals`) : null,
      dietaryRestrictionsEncrypted: dietaryRaw ? encryptField(dietaryRaw, `client:${id}:dietaryRestrictions`) : null,
      notesEncrypted: notesRaw ? encryptField(notesRaw, `client:${id}:notes`) : null,
      motivationalMessageEncrypted: motivationalRaw
        ? encryptField(motivationalRaw, `client:${id}:motivationalMessage`)
        : null,
      phoneEncrypted: phoneRaw ? encryptField(phoneRaw, `client:${id}:phone`) : null,
    };

    const client = await (prisma as any).client.update({
      where: { id },
      data: updateData,
    });

    // Parse JSON fields for response
    const goals = decryptOrFallback(client.goalsEncrypted, `client:${id}:goals`) ?? client.goals;
    const dietary =
      decryptOrFallback(client.dietaryRestrictionsEncrypted, `client:${id}:dietaryRestrictions`) ??
      client.dietaryRestrictions;

    const clientData = {
      ...client,
      phone: decryptOrFallback(client.phoneEncrypted, `client:${id}:phone`) ?? client.phone,
      notes: decryptOrFallback(client.notesEncrypted, `client:${id}:notes`) ?? client.notes,
      motivationalMessage:
        decryptOrFallback(client.motivationalMessageEncrypted, `client:${id}:motivationalMessage`) ??
        client.motivationalMessage,
      goals: goals ? JSON.parse(goals) : [],
      dietaryRestrictions: dietary ? JSON.parse(dietary) : [],
      progressPhotos: client.progressPhotos ? JSON.parse(client.progressPhotos) : [],
    };

    return NextResponse.json(clientData);
  } catch (error) {
    console.error('Error updating client:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const { id } = await params;

    // First, delete related records
    await (prisma as any).workout.deleteMany({
      where: { clientId: id },
    });

    await (prisma as any).session.deleteMany({
      where: { clientId: id },
    });

    // Then delete the client
    await (prisma as any).client.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
