import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get("coachId");

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      const defaultCoach = await prisma.user.upsert({
        where: { email: "coach@example.com" },
        update: {},
        create: {
          email: "coach@example.com",
          name: "Default Coach",
          password: "hashedpassword",
          role: "COACH",
        },
      });
      userId = defaultCoach.id;
    }

    const clients = await prisma.client.findMany({
      where: { coachId: userId },
      orderBy: { createdAt: "desc" },
    });

    // Parse JSON fields
    const parsedClients = clients.map((client) => ({
      ...client,
      dietaryRestrictions: client.dietaryRestrictions ? JSON.parse(client.dietaryRestrictions) : [],
      goals: client.goals ? JSON.parse(client.goals) : [],
      progressPhotos: client.progressPhotos ? JSON.parse(client.progressPhotos) : [],
    }));

    return NextResponse.json(parsedClients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coachId, ...clientData } = body;

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      const defaultCoach = await prisma.user.upsert({
        where: { email: "coach@example.com" },
        update: {},
        create: {
          email: "coach@example.com",
          name: "Default Coach",
          password: "hashedpassword",
          role: "COACH",
        },
      });
      userId = defaultCoach.id;
    }

    const client = await prisma.client.create({
      data: {
        ...clientData,
        coachId: userId,
        dietaryRestrictions: JSON.stringify(clientData.dietaryRestrictions || []),
        goals: JSON.stringify(clientData.goals || []),
        progressPhotos: JSON.stringify(clientData.progressPhotos || []),
      },
    });

    // Parse JSON fields for response
    const parsedClient = {
      ...client,
      dietaryRestrictions: client.dietaryRestrictions ? JSON.parse(client.dietaryRestrictions) : [],
      goals: client.goals ? JSON.parse(client.goals) : [],
      progressPhotos: client.progressPhotos ? JSON.parse(client.progressPhotos) : [],
    };

    return NextResponse.json(parsedClient, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
