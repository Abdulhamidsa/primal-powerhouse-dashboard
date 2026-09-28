import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { DifficultyLevel, VideoCategory } from '@prisma/client';
import { requireStaffActor } from '@/lib/api-auth';
import { exerciseImportSchema } from '@/features/videos/schemas/video.schema';
import { resolveVideoCoachTarget } from '@/features/videos/server/video-authorization';
import { toVideoResponse, videoResponseSelect } from '@/features/videos/server/video-response';
import { invalidateVideoCaches } from '@/lib/cache-tags';

export async function POST(request: NextRequest) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  try {
    const body = await request.json().catch(() => null);
    const parsed = exerciseImportSchema.safeParse(body);
    if (!parsed.success) return jsonWithCache({ error: 'Invalid exercise import payload' }, { status: 400 });

    const target = await resolveVideoCoachTarget(auth.actor, parsed.data.coachId, true);
    if (!target.ok) return jsonWithCache({ error: target.error }, { status: target.status });

    const existingVideo = await prisma.video.findFirst({
      where: {
        coachId: target.coachId,
        OR: [{ videoUrl: parsed.data.gifUrl }, { title: parsed.data.name }],
      },
      select: { id: true },
    });

    const createData = {
      title: parsed.data.name,
      description: `ExerciseDB: ${parsed.data.name}`,
      category: VideoCategory.FUNCTIONAL,
      difficulty: DifficultyLevel.BEGINNER,
      duration: 180,
      videoUrl: parsed.data.gifUrl,
      thumbnailUrl: parsed.data.gifUrl,
      equipment: JSON.stringify(parsed.data.equipments ?? []),
      muscleGroups: JSON.stringify([...(parsed.data.targetMuscles ?? []), ...(parsed.data.bodyParts ?? [])]),
      tags: JSON.stringify(['exercise-db', `exercise-${parsed.data.exerciseId}`]),
      instructions: JSON.stringify(parsed.data.instructions ?? []),
      tips: JSON.stringify(parsed.data.secondaryMuscles ?? []),
      isPublic: true,
      coachId: target.coachId,
    };

    const video = existingVideo
      ? await prisma.video.update({ where: { id: existingVideo.id }, data: createData, select: videoResponseSelect })
      : await prisma.video.create({ data: createData, select: videoResponseSelect });

    invalidateVideoCaches({ videoId: video.id });
    return jsonWithCache(toVideoResponse(video), { status: existingVideo ? 200 : 201 });
  } catch {
    return jsonWithCache({ error: 'Failed to import exercise' }, { status: 500 });
  }
}
