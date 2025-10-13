import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Make sure to await params (if it's a Promise) to fix "params should be awaited" error
    const id = params.id;
    console.log(`API: GET /api/clients/${id}`);

    // Check if the client ID is valid
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('API: Invalid client ID provided:', id);
      return NextResponse.json({ error: 'Invalid client ID provided' }, { status: 400 });
    }

    // Try to find the client
    console.log(`API: Looking for client with ID: ${id}`);
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      console.error(`API: Client not found with ID: ${id}`);
      return NextResponse.json({ error: `Client not found with ID: ${id}` }, { status: 404 });
    }

    console.log(`API: Found client: ${client.name}`);
    
    // Parse JSON fields
    try {
      const clientData = {
        ...client,
        goals: client.goals ? JSON.parse(client.goals) : [],
        dietaryRestrictions: client.dietaryRestrictions ? JSON.parse(client.dietaryRestrictions) : [],
        progressPhotos: client.progressPhotos ? JSON.parse(client.progressPhotos) : [],
      };

      return NextResponse.json(clientData);
    } catch (parseError) {
      console.error('API: Error parsing client JSON fields:', parseError);
      return NextResponse.json({ 
        error: 'Error parsing client data',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API: Error fetching client:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();

    // Convert arrays to JSON strings for SQLite storage
    const updateData = {
      ...body,
      goals: body.goals ? JSON.stringify(body.goals) : undefined,
      dietaryRestrictions: body.dietaryRestrictions
        ? JSON.stringify(body.dietaryRestrictions)
        : undefined,
      progressPhotos: body.progressPhotos ? JSON.stringify(body.progressPhotos) : undefined,
    };

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    // Parse JSON fields for response
    const clientData = {
      ...client,
      goals: client.goals ? JSON.parse(client.goals) : [],
      dietaryRestrictions: client.dietaryRestrictions ? JSON.parse(client.dietaryRestrictions) : [],
      progressPhotos: client.progressPhotos ? JSON.parse(client.progressPhotos) : [],
    };

    return NextResponse.json(clientData);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // First, delete related records
    await prisma.workout.deleteMany({
      where: { clientId: id },
    });

    await prisma.session.deleteMany({
      where: { clientId: id },
    });

    // Then delete the client
    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
