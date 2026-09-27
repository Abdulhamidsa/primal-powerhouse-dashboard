// @deprecated — use /api/mealsAI/generate-meal-template instead
import { NextRequest, NextResponse } from 'next/server';
import { generateMeals } from '@/lib/meal-generator';
import type { GenerateMealsInput } from '@/types/meal';
import { generateMealsSchema } from '@/features/meals/schemas/generateMeals.schema';
import { requireStaffActor } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStaffActor(request);
    if (!auth.ok) return auth.res;

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

    const meals = await generateMeals(input);

    return NextResponse.json({ success: true, data: meals });
  } catch (error: unknown) {
    console.error('mealsAI/generate error:', safeErrorMessage(error));

    return NextResponse.json(
      {
        success: false,
        message: 'Meal generation failed',
      },
      { status: 500 },
    );
  }
}
