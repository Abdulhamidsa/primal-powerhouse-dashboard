import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Meals API: Starting GET request');
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    const clientId = searchParams.get('clientId');
    
    console.log('Meals API: Request params', { coachId, clientId });

    // For demo purposes, if no coachId provided, find the seeded coach
    let userId = coachId;
    if (!userId) {
      console.log('Meals API: Finding seeded coach');
      // Try to find the seeded coach first
      let defaultCoach = await prisma.user.findFirst({
        where: { role: 'COACH' },
      });

      // If no coach exists, create one
      if (!defaultCoach) {
        console.log('Meals API: Creating default coach');
        defaultCoach = await prisma.user.create({
          data: {
            email: 'coach@fitness.com',
            name: 'Mike Johnson',
            password: 'hashedpassword',
            role: 'COACH',
          },
        });
      }

      userId = defaultCoach.id;
      console.log('Meals API: Using coach ID:', userId);
    }

    console.log('Meals API: Building query for meals');
    
    // Build the query - we'll include general coach meals and potentially client-specific personalized meals
    const whereClause: any = {
      OR: [
        // Always include the coach's own meals that aren't personalized or are general personalized meals
        {
          coachId: userId,
          OR: [
            { isPersonalized: false },
            { isPersonalized: true, clientId: null }
          ]
        }
      ]
    };
    
    // If clientId is provided, also include personalized meals for that specific client
    if (clientId) {
      console.log('Meals API: Including personalized meals for client:', clientId);
      whereClause.OR.push({ clientId: clientId });
    }
    
    console.log('Meals API: Final whereClause:', JSON.stringify(whereClause));
    
    const meals = await prisma.meal.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    console.log('Meals API: Found meals:', meals.length);

    // Parse JSON fields
    const parsedMeals = meals.map(meal => ({
      ...meal,
      ingredients: meal.ingredients ? JSON.parse(meal.ingredients) : [],
      instructions: meal.instructions ? JSON.parse(meal.instructions) : [],
      tags: meal.tags ? JSON.parse(meal.tags) : [],
    }));

    return NextResponse.json(parsedMeals);
  } catch (error) {
    console.error('Error fetching meals:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      {
        error: 'Failed to fetch meals',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Meals API: Starting POST request');
    // Get the raw request body for debugging
    const bodyText = await request.text();
    console.log('Meals API: Raw request body:', bodyText);
    
    // Parse the body
    let body;
    try {
      body = JSON.parse(bodyText);
      console.log('Meals API: Parsed request body successfully');
    } catch (parseError) {
      console.error('Meals API: Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    // Extract fields we'll handle separately (and remove fields that aren't in the schema)
    const { coachId, clientId, description, originalMealId, isPersonalized, ...mealData } = body;

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      console.log('Meals API: Finding seeded coach for POST');
      // Try to find the seeded coach first
      let defaultCoach = await prisma.user.findFirst({
        where: { role: 'COACH' },
      });

      // If no coach exists, create one
      if (!defaultCoach) {
        console.log('Meals API: Creating default coach for POST');
        defaultCoach = await prisma.user.create({
          data: {
            email: 'coach@fitness.com',
            name: 'Mike Johnson',
            password: 'hashedpassword',
            role: 'COACH',
          },
        });
      }

      userId = defaultCoach.id;
      console.log('Meals API: Using coach ID for POST:', userId);
    }

    // Create a clean meal data object that exactly matches the database schema
    // This ensures we only include valid fields
    
    // Ensure meal type is uppercase to match the Prisma enum
    let mealType = mealData.type;
    if (typeof mealType === 'string') {
      mealType = mealType.toUpperCase();
      
      // Validate that meal type is a valid enum value
      const validMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
      if (!validMealTypes.includes(mealType)) {
        console.warn(`Invalid meal type: ${mealData.type}. Using default BREAKFAST.`);
        mealType = 'BREAKFAST';
      }
    }
    
    const mealDataClean = {
      name: mealData.name,
      type: mealType,
      // Convert numeric fields to proper number type
      calories: Number(mealData.calories),
      protein: Number(mealData.protein),
      carbs: Number(mealData.carbs),
      fat: Number(mealData.fat),
      // Optional fields
      fiber: mealData.fiber !== undefined ? Number(mealData.fiber) : null,
      prepTime: mealData.prepTime !== undefined ? Number(mealData.prepTime) : null,
      cookTime: mealData.cookTime !== undefined ? Number(mealData.cookTime) : null,
      servings: Number(mealData.servings || 1),
      imageUrl: mealData.imageUrl || null,
      coachId: userId,
      // Include clientId, isPersonalized and originalMealId if provided
      clientId: clientId || null,
      isPersonalized: isPersonalized || false,
      originalMealId: originalMealId || null,
      // Format JSON fields
      ingredients: mealData.ingredients ? (
        typeof mealData.ingredients === 'string' ? mealData.ingredients : JSON.stringify(mealData.ingredients)
      ) : '[]',
      instructions: mealData.instructions ? (
        typeof mealData.instructions === 'string' ? mealData.instructions : JSON.stringify(mealData.instructions)
      ) : '[]',
      tags: mealData.tags ? (
        typeof mealData.tags === 'string' ? mealData.tags : JSON.stringify(mealData.tags)
      ) : '[]',
    };
    
    console.log('Creating meal with cleaned data:', mealDataClean);
    let createdMeal;
    
    try {
      createdMeal = await prisma.meal.create({
        data: mealDataClean
      });
      
      console.log('Meal created successfully:', createdMeal.id);
    } catch (error) {
      console.error('Error creating meal:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      
      // Try again with absolute minimal fields
      try {
        console.log('Retrying meal creation with minimal required fields');
        createdMeal = await prisma.meal.create({
          data: {
            name: mealDataClean.name,
            type: mealDataClean.type,
            calories: mealDataClean.calories,
            protein: mealDataClean.protein,
            carbs: mealDataClean.carbs,
            fat: mealDataClean.fat,
            coachId: mealDataClean.coachId,
            // Include clientId if it exists in the cleaned data
            clientId: mealDataClean.clientId || null,
            // Include isPersonalized flag
            isPersonalized: mealDataClean.isPersonalized || false,
            // Include originalMealId if it exists
            originalMealId: mealDataClean.originalMealId || null,
          }
        });
        console.log('Meal created successfully with minimal fields:', createdMeal.id);
      } catch (retryError) {
        console.error('Error on retry attempt:', retryError);
        throw retryError; // Re-throw the retry error
      }
    }
    
    // Parse JSON fields for response
    const parsedMeal = {
      ...createdMeal,
      ingredients: createdMeal.ingredients ? JSON.parse(createdMeal.ingredients) : [],
      instructions: createdMeal.instructions ? JSON.parse(createdMeal.instructions) : [],
      tags: createdMeal.tags ? JSON.parse(createdMeal.tags) : [],
    };

    return NextResponse.json(parsedMeal, { status: 201 });
  } catch (error) {
    console.error('Error creating meal:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      {
        error: 'Failed to create meal',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
