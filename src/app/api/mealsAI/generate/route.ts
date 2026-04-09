// @deprecated — use /api/mealsAI/generate-meal-template instead
import { NextResponse } from 'next/server';
import { generateMeals } from '@/lib/meal-generator';
import type { GenerateMealsInput } from '@/types/meal';
import { generateMealsSchema } from '@/features/meals/schemas/generateMeals.schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate body with Zod schema and coerce types where possible
    const parsed = generateMealsSchema.safeParse({
      calories: Number(body.calories),
      protein: Number(body.protein),
      type: body.type,
      mealCount: body.mealCount == null ? undefined : Number(body.mealCount),
      generateImages: Boolean(body.generateImages),
      imageProvider: body.imageProvider,
      imageCheckpoint: body.imageCheckpoint,
      imageQualityProfile: body.imageQualityProfile,
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.message }, { status: 400 });
    }

    const input: GenerateMealsInput = {
      calories: parsed.data.calories,
      protein: parsed.data.protein,
      type: parsed.data.type,
      mealCount: parsed.data.mealCount ?? 5,
      generateImages: parsed.data.generateImages ?? false,
      imageProvider: parsed.data.imageProvider ?? 'azure',
      imageCheckpoint: parsed.data.imageCheckpoint,
      imageQualityProfile: parsed.data.imageQualityProfile ?? 'balanced',
    };

    // Simple server-side cap
    if ((input.mealCount ?? 0) > 10) input.mealCount = 10;

    // TODO: add auth/checks here (only coaches/admins should call this in production)

    const meals = await generateMeals(input);

    return NextResponse.json({ success: true, data: meals });
  } catch (error: any) {
    // Log full error for debugging (server logs)
    console.error('mealsAI/generate error:', error);
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        success: false,
        message,
        ...(stack ? { stack: String(stack).split('\n').slice(0, 5).join('\n') } : {}),
      },
      { status: 500 },
    );
  }
}
