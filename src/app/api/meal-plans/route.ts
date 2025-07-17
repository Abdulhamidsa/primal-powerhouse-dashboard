import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    // @ts-ignore
    const mealPlans = await prisma.mealPlan.findMany({
      where: { clientId },
      include: {
        mealAssignments: {
          include: {
            meal: true,
          },
          orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    return NextResponse.json({ error: "Failed to fetch meal plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/meal-plans - Starting...");
    const body = await request.json();
    console.log("Request body:", body);

    const { clientId, name, startDate, endDate, notes, mealAssignments } = body;

    if (!clientId || !name || !startDate) {
      console.log("Missing required fields:", { clientId, name, startDate });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("Creating meal plan with data:", {
      clientId,
      name,
      startDate,
      endDate,
      notes,
      assignmentsCount: mealAssignments?.length || 0,
    });

    // Create meal plan with assignments
    // @ts-ignore
    const mealPlan = await prisma.mealPlan.create({
      data: {
        clientId,
        name,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        notes,
        mealAssignments: {
          create:
            mealAssignments?.map((assignment: any) => ({
              mealId: assignment.mealId,
              dayOfWeek: assignment.dayOfWeek,
              mealType: assignment.mealType,
              portion: assignment.portion || 1.0,
              notes: assignment.notes,
            })) || [],
        },
      },
      include: {
        mealAssignments: {
          include: {
            meal: true,
          },
        },
      },
    });

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error("Error creating meal plan:", error);
    return NextResponse.json({ error: "Failed to create meal plan" }, { status: 500 });
  }
}
