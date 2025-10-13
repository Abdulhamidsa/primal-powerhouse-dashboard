import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      let defaultCoach = await prisma.user.findFirst({
        where: { 
          AND: [
            { role: 'COACH' },
            { email: { not: 'coach@example.com' } }
          ]
        }
      });
      
      if (!defaultCoach) {
        defaultCoach = await prisma.user.upsert({
          where: { email: 'coach@fitness.com' },
          update: {},
          create: {
            email: 'coach@fitness.com',
            name: 'Mike Johnson',
            password: 'hashedpassword',
            role: 'COACH',
          },
        });
      }
      
      userId = defaultCoach.id;
    }

    // Get coach details
    const coach = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    // Get coach statistics
    const [clientCount, mealCount, videoCount] = await Promise.all([
      prisma.client.count({ where: { coachId: userId } }),
      prisma.meal.count({ where: { coachId: userId } }),
      prisma.video.count()
    ]);

    const settings = {
      profile: coach,
      statistics: {
        totalClients: clientCount,
        totalMeals: mealCount,
        totalVideos: videoCount,
        accountAge: Math.floor((Date.now() - coach.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      },
      preferences: {
        theme: 'light',
        notifications: true,
        emailUpdates: true,
        timezone: 'UTC',
        language: 'en'
      },
      limits: {
        maxClients: 100,
        maxMeals: 500,
        maxVideoAssignments: 1000
      }
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { coachId, profile, preferences } = body;

    // Get or create default coach
    let userId = coachId;
    if (!userId) {
      let defaultCoach = await prisma.user.findFirst({
        where: { 
          AND: [
            { role: 'COACH' },
            { email: { not: 'coach@example.com' } }
          ]
        }
      });
      
      if (!defaultCoach) {
        return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
      }
      
      userId = defaultCoach.id;
    }

    // Update coach profile
    const updatedCoach = await prisma.user.update({
      where: { id: userId },
      data: {
        name: profile?.name,
        email: profile?.email,
        // Note: preferences would need a separate table in a real app
        // For now, we'll just update the basic profile info
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      profile: updatedCoach
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}