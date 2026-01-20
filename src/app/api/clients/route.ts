import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      // First try to get the real coach (not the placeholder)
      let defaultCoach = await prisma.user.findFirst({
        where: {
          AND: [
            { role: 'COACH' },
            { email: { not: 'coach@example.com' } }, // Skip the placeholder coach
          ],
        },
      });

      // If no real coach found, create/get the default one
      if (!defaultCoach) {
        defaultCoach = await prisma.user.upsert({
          where: { email: 'coach@fitness.com' },
          update: {},
          create: {
            email: 'coach@fitness.com',
            name: 'Mike Johnson',
            password: 'hashedpassword',
            role: 'COACH',
          },
        });
      }

      userId = defaultCoach.id;
    }

    const clients = await prisma.client.findMany({
      where: { coachId: userId },
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    const parsedClients = clients.map(client => ({
      ...client,
      dietaryRestrictions: client.dietaryRestrictions ? JSON.parse(client.dietaryRestrictions) : [],
      goals: client.goals ? JSON.parse(client.goals) : [],
      progressPhotos: client.progressPhotos ? JSON.parse(client.progressPhotos) : [],
    }));

    return NextResponse.json(parsedClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coachId, ...clientData } = body;

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      // First try to get the real coach (not the placeholder)
      let defaultCoach = await prisma.user.findFirst({
        where: {
          AND: [
            { role: 'COACH' },
            { email: { not: 'coach@example.com' } }, // Skip the placeholder coach
          ],
        },
      });

      // If no real coach found, create/get the default one
      if (!defaultCoach) {
        defaultCoach = await prisma.user.upsert({
          where: { email: 'coach@fitness.com' },
          update: {},
          create: {
            email: 'coach@fitness.com',
            name: 'Mike Johnson',
            password: 'hashedpassword',
            role: 'COACH',
          },
        });
      }

      userId = defaultCoach.id;
    }

    // Validate required fields
    if (!clientData.name) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }
    if (!clientData.email) {
      return NextResponse.json({ error: 'Client email is required' }, { status: 400 });
    }

    // Check for existing client with same email
    const existingClient = await prisma.client.findUnique({
      where: { email: clientData.email },
    });

    if (existingClient) {
      return NextResponse.json({ error: 'A client with this email already exists' }, { status: 400 });
    }

    // Prepare password (optional: generate if not provided)
    const generatePassword = () =>
      `PP-${crypto
        .randomBytes(9)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 12)}!`;
    const plainPassword = (clientData.password && String(clientData.password).trim()) || generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Prepare data for Prisma
    const clientToCreate = {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone || null,
      avatar: clientData.avatar || null,
      status: clientData.status || 'ACTIVE',
      currentWeight: clientData.currentWeight || null,
      targetWeight: clientData.targetWeight || null,
      height: clientData.height || null,
      age: clientData.age || null,
      activityLevel: clientData.activityLevel || null,
      password: hashedPassword,
      notes: clientData.notes || null,
      sessionsCompleted: clientData.sessionsCompleted || 0,
      coachId: userId,
      dietaryRestrictions: JSON.stringify(clientData.dietaryRestrictions || []),
      goals: JSON.stringify(clientData.goals || []),
      progressPhotos: JSON.stringify(clientData.progressPhotos || []),
    };

    console.log('Creating client with:', clientToCreate);

    const client = await prisma.client.create({
      data: clientToCreate,
    });

    // Parse JSON fields for response
    const parsedClient = {
      ...client,
      dietaryRestrictions: client.dietaryRestrictions ? JSON.parse(client.dietaryRestrictions) : [],
      goals: client.goals ? JSON.parse(client.goals) : [],
      progressPhotos: client.progressPhotos ? JSON.parse(client.progressPhotos) : [],
    };

    return NextResponse.json(
      {
        client: parsedClient,
        credentials: {
          email: client.email,
          password: plainPassword,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      {
        error: `Failed to create client: ${error?.message || 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
