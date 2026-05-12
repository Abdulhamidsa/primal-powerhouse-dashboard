import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { azureOpenAI, AZURE_CHAT_DEPLOYMENT } from '@/lib/azure-openai';
import { prisma } from '@/lib/prisma';
import { matchIngredientToFood } from '@/lib/meal-matcher';
import { calculateMealMacros } from '@/lib/meal-macros';
import type { MatchedIngredient as GlobalMatchedIngredient } from '@/types/meal';

const suggestIngredientsSchema = z.object({
  mealDescription: z.string().min(3).max(500),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']).optional(),
});

export type SuggestIngredientsRequest = z.infer<typeof suggestIngredientsSchema>;

interface MatchedIngredient {
  id: string;
  name: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  grams: number;
  displayUnitLabel: string | null;
  gramsPerUnit: number | null;
}

interface UnmatchedIngredient {
  name: string;
  grams: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = suggestIngredientsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid input: ${parsed.error.message}`,
        },
        { status: 400 },
      );
    }

    const { mealDescription, mealType } = parsed.data;

    // Fetch active foods from database
    const foods = await (prisma as any).food.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        aliases: {
          select: {
            alias: true,
          },
        },
        caloriesKcal: true,
        proteinG: true,
        carbsG: true,
        fatG: true,
        fiberG: true,
        baseUnit: true,
        gramsPerUnit: true,
        displayUnitLabel: true,
      },
      take: 1500,
    });

    if (foods.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No foods available in database',
        },
        { status: 400 },
      );
    }

    // Call AI to suggest ingredients
    const mealTypeContext = mealType ? ` This is for a ${mealType.toLowerCase()}.` : '';
    const aiPrompt = `You are a nutritionist meal planning assistant. Given a meal description, suggest a list of ingredients that would be used to prepare this meal.

Meal description: "${mealDescription}"${mealTypeContext}

Return a JSON object with:
{
  "mealName": "short meal name (2-4 words)",
  "ingredients": [
    { "name": "ingredient name", "grams": estimated grams needed }
  ]
}

Ingredient names should be:
- Simple and specific (e.g., "chicken breast", "brown rice", "olive oil")
- Not vague terms (avoid "sauce", "seasoning mix", "medley")
- Realistic portion sizes (standard 100g-200g servings for proteins, 50-100g for oils)
- 8-15 ingredients total

Return ONLY valid JSON, no other text.`;

    const response = await azureOpenAI.chat.completions.create({
      model: AZURE_CHAT_DEPLOYMENT as string,
      temperature: 0.45,
      messages: [
        {
          role: 'user',
          content: aiPrompt,
        },
      ] as any,
    });

    const aiContent = response.choices[0]?.message?.content;

    if (!aiContent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to generate ingredient suggestions',
        },
        { status: 500 },
      );
    }

    // Parse AI response
    let suggestedIngredients: Array<{ name: string; grams: number }>;
    let mealName: string;

    try {
      const parsed = JSON.parse(aiContent);
      suggestedIngredients = parsed.ingredients || [];
      mealName = parsed.mealName || 'Suggested Meal';
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to parse AI response',
        },
        { status: 500 },
      );
    }

    // Match ingredients to database foods
    const matchedIngredients: MatchedIngredient[] = [];
    const unmatched: UnmatchedIngredient[] = [];

    for (const suggested of suggestedIngredients) {
      const match = matchIngredientToFood(suggested.name, suggested.grams, foods);

      if (match) {
        matchedIngredients.push({
          id: match.id,
          name: match.name,
          grams: Math.max(10, Math.min(500, suggested.grams)), // Clamp to reasonable range
          caloriesKcal: match.caloriesKcal,
          proteinG: match.proteinG,
          carbsG: match.carbsG,
          fatG: match.fatG,
          fiberG: match.fiberG ?? 0,
          displayUnitLabel: (match as any).displayUnitLabel ?? null,
          gramsPerUnit: (match as any).gramsPerUnit ?? null,
        });
      } else {
        unmatched.push({
          name: suggested.name,
          grams: suggested.grams,
        });
      }
    }

    // Calculate macros
    const macros = calculateMealMacros(matchedIngredients as unknown as GlobalMatchedIngredient[]);

    return NextResponse.json({
      success: true,
      ingredients: matchedIngredients,
      unmatched,
      macros,
      mealName,
    });
  } catch (error) {
    console.error('Ingredient suggestion error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
