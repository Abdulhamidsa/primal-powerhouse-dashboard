import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffActor } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const auth = await requireStaffActor(request);
    if (!auth.ok) return auth.res;

    if (!id) {
      return NextResponse.json({ error: 'Meal ID is required' }, { status: 400 });
    }

    // Count how many meal assignments link to this meal template
    const usageCount = await prisma.mealAssignment.count({
      where: {
        mealId: id,
      },
    });

    return NextResponse.json({
      mealId: id,
      usageCount,
      message: `This meal template is used in ${usageCount} assignment${usageCount !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Error checking meal usage:', safeErrorMessage(error));
    return NextResponse.json(
      { error: 'Failed to check meal usage' },
      { status: 500 }
    );
  }
}
