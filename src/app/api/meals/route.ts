import { NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { CACHE_TAGS, invalidateMealCaches } from '@/lib/cache-tags';

function hasMissingSpicesColumnError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return /meals\.spices/i.test(error.message) && /does not exist/i.test(error.message);
}

function safeJsonArray(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseMealForResponse(
  meal: {
    ingredients: string | null;
    spices?: string | null;
    instructions: string | null;
    tags: string | null;
    [key: string]: unknown;
  },
  spicesFallback: string[] = [],
) {
  return {
    ...meal,
    ingredients: safeJsonArray(meal.ingredients),
    spices: meal.spices ? safeJsonArray(meal.spices) : spicesFallback,
    instructions: safeJsonArray(meal.instructions),
    tags: safeJsonArray(meal.tags),
  };
}

export async function GET(_request: NextRequest) {
  try {
    console.log('Meals API: FETCH ALL');

    let meals;

    try {
      meals = await unstable_cache(
        async () =>
          prisma.meal.findMany({
            where: {
              isPersonalized: false,
            },
            orderBy: { createdAt: 'desc' },
          }),
        ['meals:list:templates'],
        { tags: [CACHE_TAGS.meals], revalidate: false },
      )();
    } catch (error) {
      if (!hasMissingSpicesColumnError(error)) {
        throw error;
      }

      console.warn('Meals API GET: spices column missing; using compatibility query.');
      meals = await prisma.$queryRawUnsafe(
        `SELECT "id", "name", "type", "calories", "protein", "carbs", "fat", "fiber", "ingredients", "instructions", "prepTime", "cookTime", "servings", "tags", "imageUrl", "isPersonalized", "originalMealId", "createdAt", "updatedAt", "coachId", "clientId"
         FROM "meals"
         WHERE "isPersonalized" = false
         ORDER BY "createdAt" DESC`,
      );
    }

    const parsedMeals = (meals as Array<any>).map(meal => parseMealForResponse(meal));

    return jsonWithCache(parsedMeals);
  } catch (error) {
    console.error('Error fetching meals:', error);
    return jsonWithCache(
      {
        error: 'Failed to fetch meals',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
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
      return jsonWithCache({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    // Extract fields we'll handle separately (and remove fields that aren't in the schema)
    const { coachId, clientId, description, originalMealId, isPersonalized, ...mealData } = body;

    // Get or create default coach
    let userId = coachId;

    // Validate provided coachId first; stale IDs should not break meal creation
    if (userId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!existingUser) {
        console.warn(`Meals API: Provided coachId not found (${userId}). Falling back to default coach.`);
        userId = undefined;
      }
    }

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
      ingredients: mealData.ingredients
        ? typeof mealData.ingredients === 'string'
          ? mealData.ingredients
          : JSON.stringify(mealData.ingredients)
        : '[]',
      spices: mealData.spices
        ? typeof mealData.spices === 'string'
          ? mealData.spices
          : JSON.stringify(mealData.spices)
        : '[]',
      instructions: mealData.instructions
        ? typeof mealData.instructions === 'string'
          ? mealData.instructions
          : JSON.stringify(mealData.instructions)
        : '[]',
      tags: mealData.tags ? (typeof mealData.tags === 'string' ? mealData.tags : JSON.stringify(mealData.tags)) : '[]',
    };

    console.log('Creating meal with cleaned data:', mealDataClean);
    let createdMeal;
    const spicesFallback = Array.isArray(mealData.spices)
      ? mealData.spices.filter((item: unknown) => typeof item === 'string' && item.trim())
      : [];

    try {
      createdMeal = await prisma.meal.create({
        data: mealDataClean,
      });

      console.log('Meal created successfully:', createdMeal.id);
    } catch (error) {
      console.error('Error creating meal:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');

      if (hasMissingSpicesColumnError(error)) {
        console.warn('Meals API POST: spices column missing; creating meal without spices column.');
        const fallbackCreatedRows = await prisma.$queryRawUnsafe(
          `INSERT INTO "meals" ("name", "type", "calories", "protein", "carbs", "fat", "fiber", "ingredients", "instructions", "prepTime", "cookTime", "servings", "tags", "imageUrl", "isPersonalized", "originalMealId", "coachId", "clientId")
           VALUES ($1, $2::"MealType", $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
           RETURNING "id", "name", "type", "calories", "protein", "carbs", "fat", "fiber", "ingredients", "instructions", "prepTime", "cookTime", "servings", "tags", "imageUrl", "isPersonalized", "originalMealId", "createdAt", "updatedAt", "coachId", "clientId"`,
          mealDataClean.name,
          mealDataClean.type,
          mealDataClean.calories,
          mealDataClean.protein,
          mealDataClean.carbs,
          mealDataClean.fat,
          mealDataClean.fiber,
          mealDataClean.ingredients,
          mealDataClean.instructions,
          mealDataClean.prepTime,
          mealDataClean.cookTime,
          mealDataClean.servings,
          mealDataClean.tags,
          mealDataClean.imageUrl,
          mealDataClean.isPersonalized,
          mealDataClean.originalMealId,
          mealDataClean.coachId,
          mealDataClean.clientId,
        );

        const fallbackCreatedMeal = (fallbackCreatedRows as Array<any>)[0];
        const parsedMeal = parseMealForResponse(fallbackCreatedMeal, spicesFallback);

        invalidateMealCaches({
          mealId: String(fallbackCreatedMeal.id),
          clientId: fallbackCreatedMeal.clientId ?? undefined,
        });

        return jsonWithCache(parsedMeal, { status: 201 });
      }

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
          },
        });
        console.log('Meal created successfully with minimal fields:', createdMeal.id);
      } catch (retryError) {
        console.error('Error on retry attempt:', retryError);
        throw retryError; // Re-throw the retry error
      }
    }

    // Parse JSON fields for response
    const parsedMeal = parseMealForResponse(createdMeal as any, spicesFallback);

    invalidateMealCaches({
      mealId: createdMeal.id,
      clientId: createdMeal.clientId ?? undefined,
    });

    return jsonWithCache(parsedMeal, { status: 201 });
  } catch (error) {
    console.error('Error creating meal:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return jsonWithCache(
      {
        error: 'Failed to create meal',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
