import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { calculateHealthMetrics } from '@/lib/health/calculators';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();

    const { currentWeight, goal, goalAggressiveness } = body;

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

    if (!client.height || !client.age || !client.gender || !client.activityLevel) {
      return jsonWithCache(
        {
          error: 'Client missing required health data (height, age, gender, or activity level)',
          details: {
            height: client.height,
            age: client.age,
            gender: client.gender,
            activityLevel: client.activityLevel,
          },
        },
        { status: 400 }
      );
    }

    // Calculate health metrics
    const metrics = await calculateHealthMetrics({
      weightKg: currentWeight,
      heightCm: client.height,
      age: client.age,
      gender: client.gender.toLowerCase() as 'male' | 'female',
      activityLevel: client.activityLevel,
      goal,
      goalAggressiveness,
    });

    if ('error' in metrics) {
      return jsonWithCache({ error: metrics.error }, { status: 400 });
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
        goal: goal || null,
        macros: JSON.stringify(metrics.macros),
        notes: metrics.notes.join('\n'),
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
      { status: 500 }
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
      { status: 500 }
    );
  }
}
