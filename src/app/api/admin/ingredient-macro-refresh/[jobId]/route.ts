import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { processIngredientMacroRefreshJob } from '@/services/ingredientMacroRefreshService';

function parseFailedErrors(value: string | null): Array<{ mealId: string; reason: string }> {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const auth = await requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const { jobId } = await params;

    const existingJob = await (prisma as any).ingredientMacroRefreshJob.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'Refresh job not found' }, { status: 404 });
    }

    if (existingJob.status === 'PENDING' || existingJob.status === 'RUNNING') {
      await processIngredientMacroRefreshJob(jobId);
    }

    const job = await (prisma as any).ingredientMacroRefreshJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Refresh job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        foodId: job.foodId,
        status: job.status,
        scope: job.scope,
        affectedMealsCount: job.affectedMealsCount,
        processedMealsCount: job.processedMealsCount,
        failedMealsCount: job.failedMealsCount,
        error: job.error,
        failedMealErrors: parseFailedErrors(job.failedMealErrorsJson),
        requestedAt: job.requestedAt.toISOString(),
        startedAt: job.startedAt ? job.startedAt.toISOString() : null,
        completedAt: job.completedAt ? job.completedAt.toISOString() : null,
        updatedAt: job.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Ingredient macro refresh status failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch ingredient macro refresh status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
