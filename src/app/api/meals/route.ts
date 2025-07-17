import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Meals API: Starting GET request");
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get("coachId");

    // For demo purposes, if no coachId provided, create a default coach
    let userId = coachId;
    if (!userId) {
      console.log("Meals API: Creating default coach");
      const defaultCoach = await prisma.user.upsert({
        where: { email: "coach@example.com" },
        update: {},
        create: {
          email: "coach@example.com",
          name: "Default Coach",
          password: "hashedpassword", // In real app, this would be properly hashed
          role: "COACH",
        },
      });
      userId = defaultCoach.id;
      console.log("Meals API: Default coach created/found:", userId);
    }

    console.log("Meals API: Fetching meals for coach:", userId);
    const meals = await prisma.meal.findMany({
      where: { coachId: userId },
      orderBy: { createdAt: "desc" },
    });

    console.log("Meals API: Found meals:", meals.length);

    // Parse JSON fields
    const parsedMeals = meals.map((meal) => ({
      ...meal,
      ingredients: meal.ingredients ? JSON.parse(meal.ingredients) : [],
      instructions: meal.instructions ? JSON.parse(meal.instructions) : [],
      tags: meal.tags ? JSON.parse(meal.tags) : [],
    }));

    return NextResponse.json(parsedMeals);
  } catch (error) {
    console.error("Error fetching meals:", error);
    console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      {
        error: "Failed to fetch meals",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Meals API: Starting POST request");
    const body = await request.json();
    console.log("Meals API: Request body received");
    const { coachId, ...mealData } = body;

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      console.log("Meals API: Creating default coach for POST");
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
      console.log("Meals API: Default coach ID:", userId);
    }

    console.log("Meals API: Creating meal with data:", mealData);
    const meal = await prisma.meal.create({
      data: {
        ...mealData,
        coachId: userId,
        ingredients: JSON.stringify(mealData.ingredients || []),
        instructions: JSON.stringify(mealData.instructions || []),
        tags: JSON.stringify(mealData.tags || []),
      },
    });

    console.log("Meals API: Meal created successfully:", meal.id);
    // Parse JSON fields for response
    const parsedMeal = {
      ...meal,
      ingredients: meal.ingredients ? JSON.parse(meal.ingredients) : [],
      instructions: meal.instructions ? JSON.parse(meal.instructions) : [],
      tags: meal.tags ? JSON.parse(meal.tags) : [],
    };

    return NextResponse.json(parsedMeal, { status: 201 });
  } catch (error) {
    console.error("Error creating meal:", error);
    console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      {
        error: "Failed to create meal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
