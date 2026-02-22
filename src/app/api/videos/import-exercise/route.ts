import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { DifficultyLevel, VideoCategory } from '@prisma/client';
import { invalidateVideoCaches } from '@/lib/cache-tags';

interface ExerciseImportPayload {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles?: string[];
  bodyParts?: string[];
  equipments?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExerciseImportPayload;

    if (!body.exerciseId || !body.name || !body.gifUrl) {
      return jsonWithCache({ error: 'exerciseId, name and gifUrl are required' }, { status: 400 });
    }

    let defaultCoach = await prisma.user.findFirst({ where: { role: 'COACH' } });

    if (!defaultCoach) {
      defaultCoach = await prisma.user.create({
        data: {
          email: 'coach@fitness.com',
          name: 'Mike Johnson',
          password: 'hashedpassword',
          role: 'COACH',
        },
      });
    }

    const existingVideo = await prisma.video.findFirst({
      where: {
        coachId: defaultCoach.id,
        OR: [{ videoUrl: body.gifUrl }, { title: body.name }],
      },
    });

    const createData = {
      title: body.name,
      description: `ExerciseDB: ${body.name}`,
      category: VideoCategory.FUNCTIONAL,
      difficulty: DifficultyLevel.BEGINNER,
      duration: 180,
      videoUrl: body.gifUrl,
      thumbnailUrl: body.gifUrl,
      equipment: JSON.stringify(body.equipments ?? []),
      muscleGroups: JSON.stringify([...(body.targetMuscles ?? []), ...(body.bodyParts ?? [])]),
      tags: JSON.stringify(['exercise-db', `exercise-${body.exerciseId}`]),
      instructions: JSON.stringify(body.instructions ?? []),
      tips: JSON.stringify(body.secondaryMuscles ?? []),
      isPublic: true,
      coachId: defaultCoach.id,
    };

    const video = existingVideo
      ? await prisma.video.update({ where: { id: existingVideo.id }, data: createData })
      : await prisma.video.create({ data: createData });

    const parsedVideo = {
      ...video,
      equipment: video.equipment ? JSON.parse(video.equipment) : [],
      muscleGroups: video.muscleGroups ? JSON.parse(video.muscleGroups) : [],
      tags: video.tags ? JSON.parse(video.tags) : [],
      instructions: video.instructions ? JSON.parse(video.instructions) : [],
      tips: video.tips ? JSON.parse(video.tips) : [],
    };

    invalidateVideoCaches({ videoId: video.id });

    return jsonWithCache(parsedVideo, { status: existingVideo ? 200 : 201 });
  } catch (error) {
    console.error('Error importing exercise as video:', error);
    return jsonWithCache(
      {
        error: 'Failed to import exercise',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
