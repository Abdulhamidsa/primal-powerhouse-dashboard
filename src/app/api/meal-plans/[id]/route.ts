import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // @ts-ignore
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: params.id },
      include: {
        mealAssignments: {
          include: {
            meal: true,
          },
          orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
        },
      },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    return NextResponse.json({ error: "Failed to fetch meal plan" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, startDate, endDate, notes, isActive } = body;

    // @ts-ignore
    const mealPlan = await prisma.mealPlan.update({
      where: { id: params.id },
      data: {
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        notes,
        isActive,
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
    console.error("Error updating meal plan:", error);
    return NextResponse.json({ error: "Failed to update meal plan" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // @ts-ignore
    await prisma.mealPlan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    return NextResponse.json({ error: "Failed to delete meal plan" }, { status: 500 });
  }
}
