import { NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { CACHE_TAGS, invalidateVideoCaches, videoTag } from '@/lib/cache-tags';
import { requireStaffActor } from '@/lib/api-auth';
import { videoUpdateSchema } from '@/features/videos/schemas/video.schema';
import { resolveVideoCoachTarget } from '@/features/videos/server/video-authorization';
import { toVideoResponse, videoResponseSelect } from '@/features/videos/server/video-response';

async function getVideo(id: string) {
  return prisma.video.findUnique({ where: { id }, select: videoResponseSelect });
}

function isVideoAllowed(actor: { id: string; role: 'ADMIN' | 'COACH' }, coachId: string) {
  return actor.role === 'ADMIN' || actor.id === coachId;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  try {
    const { id } = await params;
    const video = await unstable_cache(
      () => getVideo(id),
      [`video:${id}`],
      { tags: [CACHE_TAGS.videos, videoTag(id)], revalidate: false },
    )();

    if (!video) return jsonWithCache({ error: 'Video not found' }, { status: 404 });
    if (!isVideoAllowed(auth.actor, video.coachId)) return jsonWithCache({ error: 'Forbidden' }, { status: 403 });

    return jsonWithCache(toVideoResponse(video));
  } catch {
    return jsonWithCache({ error: 'Failed to fetch video' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  try {
    const { id } = await params;
    const existing = await getVideo(id);
    if (!existing) return jsonWithCache({ error: 'Video not found' }, { status: 404 });
    if (!isVideoAllowed(auth.actor, existing.coachId)) return jsonWithCache({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json().catch(() => null);
    const parsed = videoUpdateSchema.safeParse(body);
    if (!parsed.success) return jsonWithCache({ error: 'Invalid video payload' }, { status: 400 });

    const target = await resolveVideoCoachTarget(auth.actor, parsed.data.coachId, false);
    if (!target.ok) return jsonWithCache({ error: target.error }, { status: target.status });

    const { coachId: _requestedCoachId, ...input } = parsed.data;
    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.category !== undefined) data.category = input.category;
    if (input.difficulty !== undefined) data.difficulty = input.difficulty;
    if (input.duration !== undefined) data.duration = input.duration;
    if (input.videoUrl !== undefined) data.videoUrl = input.videoUrl;
    if (input.thumbnailUrl !== undefined) data.thumbnailUrl = input.thumbnailUrl || null;
    if (input.equipment !== undefined) data.equipment = JSON.stringify(input.equipment);
    if (input.muscleGroups !== undefined) data.muscleGroups = JSON.stringify(input.muscleGroups);
    if (input.tags !== undefined) data.tags = JSON.stringify(input.tags);
    if (input.instructions !== undefined) data.instructions = JSON.stringify(input.instructions);
    if (input.tips !== undefined) data.tips = JSON.stringify(input.tips);
    if (input.isPublic !== undefined) data.isPublic = input.isPublic;
    if (auth.actor.role === 'ADMIN' && parsed.data.coachId) data.coachId = target.coachId;

    const video = await prisma.video.update({ where: { id }, data, select: videoResponseSelect });
    invalidateVideoCaches({ videoId: video.id });
    return jsonWithCache(toVideoResponse(video));
  } catch {
    return jsonWithCache({ error: 'Failed to update video' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  try {
    const { id } = await params;
    const existing = await prisma.video.findUnique({ where: { id }, select: { id: true, coachId: true } });
    if (!existing) return jsonWithCache({ error: 'Video not found' }, { status: 404 });
    if (!isVideoAllowed(auth.actor, existing.coachId)) return jsonWithCache({ error: 'Forbidden' }, { status: 403 });

    await prisma.video.delete({ where: { id } });
    invalidateVideoCaches({ videoId: id });
    return jsonWithCache({ message: 'Video deleted successfully' });
  } catch {
    return jsonWithCache({ error: 'Failed to delete video' }, { status: 500 });
  }
}
