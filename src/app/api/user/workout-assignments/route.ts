import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';

/**
 * GET /api/user/workout-assignments
 * Returns all active workout plan assignments for the authenticated client.
 */
export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const clientId = auth.user.userId;

  const assignments = await (prisma as any).workoutPlanAssignment.findMany({
    where: { clientId, isActive: true },
    include: {
      sessions: {
        select: { id: true, status: true, completedAt: true },
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
      workoutPlan: {
        include: {
          exercises: {
            orderBy: { order: 'asc' },
            include: {
              video: {
                select: {
                  id: true,
                  title: true,
                  thumbnailUrl: true,
                  duration: true,
                  videoUrl: true,
                  muscleGroups: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  });

  return NextResponse.json(assignments, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
