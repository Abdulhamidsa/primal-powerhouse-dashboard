import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Parse JSON fields
    const parsedVideo = {
      ...video,
      equipment: video.equipment ? JSON.parse(video.equipment) : [],
      muscleGroups: video.muscleGroups ? JSON.parse(video.muscleGroups) : [],
      tags: video.tags ? JSON.parse(video.tags) : [],
      instructions: video.instructions ? JSON.parse(video.instructions) : [],
      tips: video.tips ? JSON.parse(video.tips) : [],
    };

    return NextResponse.json(parsedVideo);
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { coachId, ...videoData } = body;

    const video = await prisma.video.update({
      where: { id },
      data: {
        ...videoData,
        equipment: JSON.stringify(videoData.equipment || []),
        muscleGroups: JSON.stringify(videoData.muscleGroups || []),
        tags: JSON.stringify(videoData.tags || []),
        instructions: JSON.stringify(videoData.instructions || []),
        tips: JSON.stringify(videoData.tips || []),
      },
    });

    // Parse JSON fields for response
    const parsedVideo = {
      ...video,
      equipment: video.equipment ? JSON.parse(video.equipment) : [],
      muscleGroups: video.muscleGroups ? JSON.parse(video.muscleGroups) : [],
      tags: video.tags ? JSON.parse(video.tags) : [],
      instructions: video.instructions ? JSON.parse(video.instructions) : [],
      tips: video.tips ? JSON.parse(video.tips) : [],
    };

    return NextResponse.json(parsedVideo);
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.video.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
