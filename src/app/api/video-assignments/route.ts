import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { CACHE_TAGS, clientVideoAssignmentsTag, invalidateVideoCaches } from '@/lib/cache-tags';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const assignments = await unstable_cache(
      async () =>
        prisma.videoAssignment.findMany({
          where: { clientId },
          include: {
            video: true,
          },
          orderBy: { assignedDate: 'desc' },
        }),
      [`video-assignments:${clientId}`],
      {
        tags: [CACHE_TAGS.videoAssignments, clientVideoAssignmentsTag(clientId)],
        revalidate: false,
      }
    )();

    // Parse JSON fields in videos
    const parsedAssignments = assignments.map((assignment: (typeof assignments)[number]) => ({
      ...assignment,
      video: assignment.video
        ? {
            ...assignment.video,
            equipment: assignment.video.equipment ? JSON.parse(assignment.video.equipment) : [],
            muscleGroups: assignment.video.muscleGroups ? JSON.parse(assignment.video.muscleGroups) : [],
            tags: assignment.video.tags ? JSON.parse(assignment.video.tags) : [],
            instructions: assignment.video.instructions ? JSON.parse(assignment.video.instructions) : [],
            tips: assignment.video.tips ? JSON.parse(assignment.video.tips) : [],
          }
        : null,
    }));

    return NextResponse.json(parsedAssignments);
  } catch (error) {
    console.error('Error fetching video assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch video assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle bulk assignments
    if (body.assignments && Array.isArray(body.assignments)) {
      const results = [];

      for (const item of body.assignments) {
        const { clientId, videoId, dueDate, notes } = item;

        if (!clientId || !videoId) {
          continue; // Skip invalid assignments
        }

        const assignment = await prisma.videoAssignment.create({
          data: {
            clientId,
            videoId,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            notes,
            isCompleted: false,
            progress: 0,
          },
        });

        results.push(assignment);

        invalidateVideoCaches({
          videoId,
          clientId,
          videoAssignmentId: assignment.id,
          userId: clientId,
        });
      }

      return NextResponse.json(
        {
          message: `Created ${results.length} video assignments successfully`,
          count: results.length,
        },
        { status: 201 }
      );
    }

    // Handle single assignment (backward compatibility)
    const { clientId, videoId, dueDate, notes } = body;

    if (!clientId || !videoId) {
      return NextResponse.json(
        {
          error: 'Client ID and Video ID are required',
        },
        { status: 400 }
      );
    }

    const assignment = await prisma.videoAssignment.create({
      data: {
        clientId,
        videoId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        isCompleted: false,
        progress: 0,
      },
      include: {
        video: true,
      },
    });

    // Parse JSON fields in video
    const parsedAssignment = {
      ...assignment,
      video: assignment.video
        ? {
            ...assignment.video,
            equipment: assignment.video.equipment ? JSON.parse(assignment.video.equipment) : [],
            muscleGroups: assignment.video.muscleGroups ? JSON.parse(assignment.video.muscleGroups) : [],
            tags: assignment.video.tags ? JSON.parse(assignment.video.tags) : [],
            instructions: assignment.video.instructions ? JSON.parse(assignment.video.instructions) : [],
            tips: assignment.video.tips ? JSON.parse(assignment.video.tips) : [],
          }
        : null,
    };

    invalidateVideoCaches({
      videoId,
      clientId,
      videoAssignmentId: assignment.id,
      userId: clientId,
    });

    return NextResponse.json(parsedAssignment, { status: 201 });
  } catch (error) {
    console.error('Error creating video assignment:', error);
    return NextResponse.json({ error: 'Failed to create video assignment' }, { status: 500 });
  }
}
