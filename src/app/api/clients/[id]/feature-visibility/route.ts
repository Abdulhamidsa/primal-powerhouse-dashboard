import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireStaffClientAccess } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';
import { clientFeatureVisibilitySchema } from '@/features/client-feature-visibility/schemas/clientFeatureVisibility.schema';
import { invalidateUserDashboardSummaryCaches } from '@/lib/cache-tags';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await requireStaffClientAccess(request, id);
    if (!access.ok) return access.res;

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json({ error: 'Invalid client ID provided' }, { status: 400 });
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get or create feature visibility settings
    let featureVisibility = await prisma.clientFeatureVisibility.findUnique({
      where: { clientId: id },
    });

    if (!featureVisibility) {
      // Create with defaults if doesn't exist
      featureVisibility = await prisma.clientFeatureVisibility.create({
        data: {
          clientId: id,
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await requireStaffClientAccess(request, id);
    if (!access.ok) return access.res;
    const body = await request.json();
    const parsed = clientFeatureVisibilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    // Get or create feature visibility record
    let featureVisibility = await prisma.clientFeatureVisibility.findUnique({
      where: { clientId: id },
    });

    if (!featureVisibility) {
      featureVisibility = await prisma.clientFeatureVisibility.create({
        data: {
          clientId: id,
          ...parsed.data,
        },
      });
    } else {
      featureVisibility = await prisma.clientFeatureVisibility.update({
        where: { clientId: id },
        data: parsed.data,
      });
    }

    invalidateUserDashboardSummaryCaches({ clientId: id });

    return NextResponse.json(featureVisibility);
  } catch (error) {
    console.error('Error updating client feature visibility:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
