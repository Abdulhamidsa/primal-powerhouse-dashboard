import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireStaffClientAccess } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

/**
 * GET handler for client meal plans
 *
 * Returns all meal plans for a specific client, with the active plan listed first
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const access = await requireStaffClientAccess(request, id);
    if (!access.ok) return access.res;

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json({ error: `Client with ID ${id} not found` }, { status: 404 });
    }

    // Fetch meal plans for this client, ordered by isActive (active plans first)
    // and then by createdAt (newest first)
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        clientId: id,
      },
      include: {
        mealAssignments: {
          include: {
            meal: true,
            side: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error('Error fetching client meal plans:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Failed to fetch meal plans' }, { status: 500 });
  }
}
