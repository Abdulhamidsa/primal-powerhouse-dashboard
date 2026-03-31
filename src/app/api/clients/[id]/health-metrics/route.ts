import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { calculateHealthMetrics } from '@/lib/health/calculators';
import { healthMetricsRequestSchema } from '@/features/health-metrics/schemas/healthMetrics.schema';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();
    const parsed = healthMetricsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonWithCache(
        {
          error: 'Invalid request payload',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      currentWeight,
      goal,
      mode,
      activityLevelOverride,
      compositeActivity,
      goalDirection,
      coachingPhase,
      isLeanClient,
      waistCircumferenceCm,
      macroMode,
      weeklyRatePercent,
      bodyFatPercentage,
      formulaPreference,
    } = parsed.data;

    if (!currentWeight || !clientId) {
      return jsonWithCache({ error: 'Missing required fields: clientId and currentWeight' }, { status: 400 });
    }

    // Fetch client data
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        currentWeight: true,
        targetWeight: true,
        height: true,
        age: true,
        gender: true,
        activityLevel: true,
      },
    });

    if (!client) {
      return jsonWithCache({ error: 'Client not found' }, { status: 404 });
    }

    if (!client.height || !client.age || !client.gender || (!client.activityLevel && !compositeActivity)) {
      return jsonWithCache(
        {
          error: 'Client missing required health data (height, age, gender, or activity profile)',
          details: {
            height: client.height,
            age: client.age,
            gender: client.gender,
            activityLevel: client.activityLevel,
          },
        },
        { status: 400 },
      );
    }

    const selectedActivityLevel = activityLevelOverride ?? client.activityLevel;

    // Calculate health metrics
    const metrics = await calculateHealthMetrics({
      weightKg: currentWeight,
      heightCm: client.height,
      age: client.age,
      gender: client.gender.toLowerCase() as 'male' | 'female',
      activityLevel: selectedActivityLevel,
      compositeActivity,
      goal,
      goalDirection,
      coachingPhase,
      isLeanClient,
      waistCircumferenceCm,
      macroMode,
      weeklyRatePercent,
      bodyFatPercentage: bodyFatPercentage ?? undefined,
      formulaPreference,
    });

    if ('error' in metrics) {
      return jsonWithCache({ error: metrics.error }, { status: 400 });
    }

    if (mode === 'preview') {
      return jsonWithCache({
        success: true,
        applied: false,
        metrics,
      });
    }

    // Save to database
    const healthMetric = await prisma.healthMetric.create({
      data: {
        clientId,
        weight: currentWeight,
        bmi: metrics.bmi,
        bmr: metrics.bmr,
        tdee: metrics.tdee,
        recommendedCals: metrics.recommendedCalories,
        bmiCategory: metrics.bmiCategory,
        goal: goalDirection ?? goal ?? null,
        macros: JSON.stringify(metrics.macros),
        notes: [...metrics.notes, ...metrics.safetyWarnings].join('\n'),
      },
    });

    // Update client with current weight and goal
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        currentWeight,
        goalCalories: metrics.recommendedCalories,
        goalMacros: JSON.stringify(metrics.macros),
      },
      select: {
        id: true,
        name: true,
        currentWeight: true,
        goalCalories: true,
      },
    });

    return jsonWithCache({
      success: true,
      applied: true,
      metrics,
      healthMetric,
      client: updatedClient,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Error calculating health metrics:', errorMessage);
    console.error('Full error:', error);
    return jsonWithCache(
      {
        error: 'Failed to calculate health metrics',
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}

// GET endpoint to fetch health metric history
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    const metrics = await prisma.healthMetric.findMany({
      where: { clientId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });

    return jsonWithCache(metrics);
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    return jsonWithCache(
      {
        error: 'Failed to fetch health metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
