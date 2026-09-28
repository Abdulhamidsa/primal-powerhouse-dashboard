import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { CACHE_TAGS, clientVideoAssignmentsTag, userVideosTag } from '@/lib/cache-tags';
import { safeErrorMessage } from '@/lib/security/log-redaction';

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all video assignments for the user
    const videoAssignments = await unstable_cache(
      async () =>
        prisma.videoAssignment.findMany({
          where: {
            clientId: user.userId,
          },
          include: {
            video: true,
          },
          orderBy: { assignedDate: 'desc' },
        }),
      [`user-videos:${user.userId}`],
      {
        tags: [
          CACHE_TAGS.userVideos,
          CACHE_TAGS.videoAssignments,
          userVideosTag(user.userId),
          clientVideoAssignmentsTag(user.userId),
        ],
        revalidate: false,
      }
    )();

    return jsonWithCache(videoAssignments);
  } catch (error) {
    console.error('[USER_VIDEOS_GET] Failed:', safeErrorMessage(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
