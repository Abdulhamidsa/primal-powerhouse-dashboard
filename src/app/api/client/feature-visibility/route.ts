import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireApiAuth } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth(request, 'client');
    if (!auth.ok) return auth.res;

    const clientId = auth.user.userId;

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get or create feature visibility settings
    let featureVisibility = await prisma.clientFeatureVisibility.findUnique({
      where: { clientId },
    });

    if (!featureVisibility) {
      // Create with defaults if doesn't exist
      featureVisibility = await prisma.clientFeatureVisibility.create({
        data: {
          clientId,
          dailyCheckinsEnabled: true,
          dailyWeightEnabled: true,
          weeklyCheckinsEnabled: true,
          weightChartEnabled: true,
          progressPhotosEnabled: true,
          nutritionTrackingEnabled: true,
          workoutTrackingEnabled: true,
        },
      });
    }

    return jsonWithCache(featureVisibility);
  } catch (error) {
    console.error('Error fetching client feature visibility:', safeErrorMessage(error));
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: safeErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
