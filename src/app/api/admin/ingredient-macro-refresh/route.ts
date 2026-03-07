import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { ingredientMacroRefreshRequestSchema } from '@/features/ingredient-macro-refresh/schemas/refresh.schema';
import { countAffectedMealsForFood } from '@/services/ingredientMacroRefreshService';

function toDbScope(scope: 'all' | 'templates_only'): 'ALL' | 'TEMPLATES_ONLY' {
  return scope === 'templates_only' ? 'TEMPLATES_ONLY' : 'ALL';
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const payloadRaw = await request.json().catch(() => null);
    const parsed = ingredientMacroRefreshRequestSchema.safeParse(payloadRaw);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid refresh payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const scopeDb = toDbScope(parsed.data.scope);
    const affectedMealsCount = await countAffectedMealsForFood(parsed.data.foodId, scopeDb);

    if (!parsed.data.confirm) {
      return NextResponse.json({
        success: true,
        mode: 'preview',
        affectedMealsCount,
      });
    }

    const foodExists = await (prisma as any).food.findUnique({ where: { id: parsed.data.foodId } });

    if (!foodExists) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    const job = await (prisma as any).ingredientMacroRefreshJob.create({
      data: {
        foodId: parsed.data.foodId,
        requestedById: auth.user.userId,
        scope: scopeDb,
        affectedMealsCount,
        status: 'PENDING',
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      mode: 'started',
      jobId: job.id,
      affectedMealsCount,
    });
  } catch (error) {
    console.error('Ingredient macro refresh start failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to start ingredient macro refresh',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
