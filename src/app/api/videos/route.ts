import { NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { CACHE_TAGS, invalidateVideoCaches } from '@/lib/cache-tags';
import { requireStaffActor } from '@/lib/api-auth';
import { videoListQuerySchema, videoWriteSchema } from '@/features/videos/schemas/video.schema';
import { resolveVideoCoachTarget } from '@/features/videos/server/video-authorization';
import { toVideoResponse, videoResponseSelect } from '@/features/videos/server/video-response';

function parseListQuery(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return videoListQuerySchema.safeParse({
    category: params.get('category') && params.get('category') !== 'all' ? params.get('category') : undefined,
    difficulty: params.get('difficulty') && params.get('difficulty') !== 'all' ? params.get('difficulty') : undefined,
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  const parsedQuery = parseListQuery(request);
  if (!parsedQuery.success) return jsonWithCache({ error: 'Invalid video filters' }, { status: 400 });

  try {
    const where = {
      ...(auth.actor.role === 'COACH' ? { coachId: auth.actor.id } : {}),
      ...(parsedQuery.data.category ? { category: parsedQuery.data.category } : {}),
      ...(parsedQuery.data.difficulty ? { difficulty: parsedQuery.data.difficulty } : {}),
    };
    const cacheKey = [
      'videos:list',
      auth.actor.role,
      auth.actor.id,
      String(parsedQuery.data.category ?? 'all'),
      String(parsedQuery.data.difficulty ?? 'all'),
    ];

    const videos = await unstable_cache(
      () => prisma.video.findMany({ where, orderBy: { createdAt: 'desc' }, select: videoResponseSelect }),
      cacheKey,
      { tags: [CACHE_TAGS.videos], revalidate: false },
    )();

    return jsonWithCache(videos.map(toVideoResponse));
  } catch {
    return jsonWithCache({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  try {
    const body = await request.json().catch(() => null);
    const parsed = videoWriteSchema.safeParse(body);
    if (!parsed.success) return jsonWithCache({ error: 'Invalid video payload' }, { status: 400 });

    const target = await resolveVideoCoachTarget(auth.actor, parsed.data.coachId, true);
    if (!target.ok) return jsonWithCache({ error: target.error }, { status: target.status });

    const { coachId: _requestedCoachId, ...input } = parsed.data;
    const video = await prisma.video.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        difficulty: input.difficulty,
        duration: input.duration,
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl || null,
        equipment: JSON.stringify(input.equipment ?? []),
        muscleGroups: JSON.stringify(input.muscleGroups ?? []),
        tags: JSON.stringify(input.tags ?? []),
        instructions: JSON.stringify(input.instructions ?? []),
        tips: JSON.stringify(input.tips ?? []),
        isPublic: input.isPublic ?? true,
        coachId: target.coachId,
      },
      select: videoResponseSelect,
    });

    invalidateVideoCaches({ videoId: video.id });
    return jsonWithCache(toVideoResponse(video), { status: 201 });
  } catch {
    return jsonWithCache({ error: 'Failed to create video' }, { status: 500 });
  }
}
