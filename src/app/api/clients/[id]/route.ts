import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Parse JSON fields
    const clientData = {
      ...client,
      goals: client.goals ? JSON.parse(client.goals) : [],
      dietaryRestrictions: client.dietaryRestrictions ? JSON.parse(client.dietaryRestrictions) : [],
      progressPhotos: client.progressPhotos ? JSON.parse(client.progressPhotos) : [],
    };

    return NextResponse.json(clientData);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Convert arrays to JSON strings for SQLite storage
    const updateData = {
      ...body,
      goals: body.goals ? JSON.stringify(body.goals) : undefined,
      dietaryRestrictions: body.dietaryRestrictions ? JSON.stringify(body.dietaryRestrictions) : undefined,
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
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

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

    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
