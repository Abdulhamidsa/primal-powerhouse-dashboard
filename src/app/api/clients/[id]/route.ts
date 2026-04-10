import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { decryptOrFallback, encryptField } from '@/lib/security/field-crypto';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { z } from 'zod';

function isMissingFieldEncryptionKeyError(error: unknown): boolean {
  return String(error).includes('Field encryption key is not configured');
}

function encryptIfAvailable(value: string | null, context: string): string | null {
  if (!value) return null;
  try {
    return encryptField(value, context);
  } catch (error) {
    if (isMissingFieldEncryptionKeyError(error)) return null;
    throw error;
  }
}

function decryptWithPlaintextFallback(
  encryptedValue: string | null,
  plaintextValue: string | null,
  context: string
): string | null {
  if (!encryptedValue) return plaintextValue;
  try {
    return decryptOrFallback(encryptedValue, context) ?? plaintextValue;
  } catch (error) {
    if (isMissingFieldEncryptionKeyError(error)) return plaintextValue;
    throw error;
  }
}

const adminClientUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    age: z.number().int().min(10).max(120).nullable().optional(),
    gender: z.enum(['MALE', 'FEMALE']).nullable().optional(),
    activityLevel: z.enum(['LOW', 'MODERATE', 'HIGH']).nullable().optional(),
    height: z.number().finite().min(90).max(260).nullable().optional(),
    currentWeight: z.number().finite().min(20).max(350).nullable().optional(),
    targetWeight: z.number().finite().min(20).max(350).nullable().optional(),
    notes: z.string().max(10000).nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  })
  .strict()
  .refine(value => Object.keys(value).length > 0, {
    message: 'Provide at least one editable field',
  });

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
        try {
          await (prisma as any).client.update({
            where: { id: client.id },
            data: {
              notesEncrypted: encryptIfAvailable(client.notes, `client:${client.id}:notes`),
              goalsEncrypted: encryptIfAvailable(client.goals, `client:${client.id}:goals`),
              dietaryRestrictionsEncrypted: encryptIfAvailable(
                client.dietaryRestrictions,
                `client:${client.id}:dietaryRestrictions`
              ),
              phoneEncrypted: encryptIfAvailable(client.phone, `client:${client.id}:phone`),
              motivationalMessageEncrypted: encryptIfAvailable(
                client.motivationalMessage,
                `client:${client.id}:motivationalMessage`
              ),
            },
          });
        } catch (error) {
          if (!isMissingFieldEncryptionKeyError(error)) {
            throw error;
          }
        }
      }

      const goalsRaw = decryptWithPlaintextFallback(client.goalsEncrypted, client.goals, `client:${client.id}:goals`);
      const dietaryRaw = decryptWithPlaintextFallback(
        client.dietaryRestrictionsEncrypted,
        client.dietaryRestrictions,
        `client:${client.id}:dietaryRestrictions`
      );

      const clientData = {
        ...client,
        phone: decryptWithPlaintextFallback(client.phoneEncrypted, client.phone, `client:${client.id}:phone`),
        notes: decryptWithPlaintextFallback(client.notesEncrypted, client.notes, `client:${client.id}:notes`),
        motivationalMessage: decryptWithPlaintextFallback(
          client.motivationalMessageEncrypted,
          client.motivationalMessage,
          `client:${client.id}:motivationalMessage`
        ),
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
    const parsed = adminClientUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const actor = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { id: true, role: true },
    });

    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'COACH')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingClient = await prisma.client.findUnique({
      where: { id },
      select: { id: true, coachId: true },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (actor.role === 'COACH' && existingClient.coachId !== actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData = {
      name: parsed.data.name,
      age: parsed.data.age,
      gender: parsed.data.gender,
      activityLevel: parsed.data.activityLevel,
      height: parsed.data.height,
      currentWeight: parsed.data.currentWeight,
      targetWeight: parsed.data.targetWeight,
      notes: parsed.data.notes,
      notesEncrypted: parsed.data.notes !== undefined ? null : undefined,
      status: parsed.data.status,
    };

    const client = await (prisma as any).client.update({
      where: { id },
      data: updateData,
    });

    // Parse JSON fields for response
    const goals = decryptWithPlaintextFallback(client.goalsEncrypted, client.goals, `client:${id}:goals`);
    const dietary = decryptWithPlaintextFallback(
      client.dietaryRestrictionsEncrypted,
      client.dietaryRestrictions,
      `client:${id}:dietaryRestrictions`
    );

    const clientData = {
      ...client,
      phone: decryptWithPlaintextFallback(client.phoneEncrypted, client.phone, `client:${id}:phone`),
      notes: decryptWithPlaintextFallback(client.notesEncrypted, client.notes, `client:${id}:notes`),
      motivationalMessage: decryptWithPlaintextFallback(
        client.motivationalMessageEncrypted,
        client.motivationalMessage,
        `client:${id}:motivationalMessage`
      ),
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
