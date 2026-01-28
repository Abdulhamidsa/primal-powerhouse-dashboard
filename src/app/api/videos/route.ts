import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

export async function GET(request: NextRequest) {
  try {
    console.log('Videos API: Starting GET request');
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    console.log('Videos API: Request params:', { coachId, category, difficulty });

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      console.log('Videos API: Finding seeded coach');
      // Try to find the seeded coach first
      let defaultCoach = await prisma.user.findFirst({
        where: { role: 'COACH' },
      });

      // If no coach exists, create one
      if (!defaultCoach) {
        console.log('Videos API: Creating default coach');
        defaultCoach = await prisma.user.create({
          data: {
            email: 'coach@fitness.com',
            name: 'Mike Johnson',
            password: 'hashedpassword',
            role: 'COACH',
          },
        });
      }

      userId = defaultCoach.id;
      console.log('Videos API: Using coach ID:', userId);
    }

    // Build filter conditions
    const whereConditions: any = { coachId: userId };

    if (category && category !== 'all') {
      whereConditions.category = category;
    }

    if (difficulty && difficulty !== 'all') {
      whereConditions.difficulty = difficulty;
    }

    console.log('Videos API: Fetching videos with conditions:', whereConditions);
    const videos = await prisma.video.findMany({
      where: whereConditions,
      orderBy: { createdAt: 'desc' },
    });

    console.log('Videos API: Found videos:', videos.length);
    // Parse JSON fields
    const parsedVideos = videos.map(video => ({
      ...video,
      equipment: video.equipment ? JSON.parse(video.equipment) : [],
      muscleGroups: video.muscleGroups ? JSON.parse(video.muscleGroups) : [],
      tags: video.tags ? JSON.parse(video.tags) : [],
      instructions: video.instructions ? JSON.parse(video.instructions) : [],
      tips: video.tips ? JSON.parse(video.tips) : [],
    }));

    return jsonWithCache(parsedVideos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return jsonWithCache(
      {
        error: 'Failed to fetch videos',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Videos API: Starting POST request');
    const body = await request.json();
    console.log('Videos API: Request body received');
    const { coachId, ...videoData } = body;

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      console.log('Videos API: Finding seeded coach for POST');
      // Try to find the seeded coach first
      let defaultCoach = await prisma.user.findFirst({
        where: { role: 'COACH' },
      });

      // If no coach exists, create one
      if (!defaultCoach) {
        console.log('Videos API: Creating default coach for POST');
        defaultCoach = await prisma.user.create({
          data: {
            email: 'coach@fitness.com',
            name: 'Mike Johnson',
            password: 'hashedpassword',
            role: 'COACH',
          },
        });
      }

      userId = defaultCoach.id;
      console.log('Videos API: Using coach ID for POST:', userId);
    }

    console.log('Videos API: Creating video with data:', videoData);
    const video = await prisma.video.create({
      data: {
        ...videoData,
        coachId: userId,
        equipment: JSON.stringify(videoData.equipment || []),
        muscleGroups: JSON.stringify(videoData.muscleGroups || []),
        tags: JSON.stringify(videoData.tags || []),
        instructions: JSON.stringify(videoData.instructions || []),
        tips: JSON.stringify(videoData.tips || []),
      },
    });

    console.log('Videos API: Video created successfully:', video.id);
    // Parse JSON fields for response
    const parsedVideo = {
      ...video,
      equipment: video.equipment ? JSON.parse(video.equipment) : [],
      muscleGroups: video.muscleGroups ? JSON.parse(video.muscleGroups) : [],
      tags: video.tags ? JSON.parse(video.tags) : [],
      instructions: video.instructions ? JSON.parse(video.instructions) : [],
      tips: video.tips ? JSON.parse(video.tips) : [],
    };

    return jsonWithCache(parsedVideo, { status: 201 });
  } catch (error) {
    console.error('Error creating video:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return jsonWithCache(
      {
        error: 'Failed to create video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

