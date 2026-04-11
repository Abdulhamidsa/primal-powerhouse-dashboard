import { NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { CACHE_TAGS, clientWorkoutPlansTag } from '@/lib/cache-tags';

/**
 * GET /api/user/workout-assignments
 * Returns all active workout plan assignments for the authenticated client.
 */
export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const clientId = auth.user.userId;

  const assignments = await unstable_cache(
    async () =>
      (prisma as any).workoutPlanAssignment.findMany({
        where: { clientId, isActive: true },
        include: {
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
      }),
    [`workout-assignments:client:${clientId}`],
    { tags: [CACHE_TAGS.workoutPlanAssignments, clientWorkoutPlansTag(clientId)], revalidate: false },
  )();

  return jsonWithCache(assignments);
}
