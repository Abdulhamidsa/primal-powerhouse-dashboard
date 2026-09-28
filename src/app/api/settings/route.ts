import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffActor } from '@/lib/api-auth';
import { settingsUpdateSchema } from '@/features/settings/schemas/settings.schema';

export async function GET(request: NextRequest) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  try {
    const coach = await prisma.user.findUnique({
      where: { id: auth.actor.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!coach) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });

    const coachScope = auth.actor.role === 'COACH' ? { coachId: auth.actor.id } : undefined;
    const [clientCount, mealCount, videoCount] = await Promise.all([
      prisma.client.count({ where: coachScope }),
      prisma.meal.count({ where: coachScope }),
      prisma.video.count({ where: coachScope }),
    ]);

    return NextResponse.json({
      profile: coach,
      statistics: {
        totalClients: clientCount,
        totalMeals: mealCount,
        totalVideos: videoCount,
        accountAge: Math.floor((Date.now() - coach.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      },
      preferences: {
        theme: 'light',
        notifications: true,
        emailUpdates: true,
        timezone: 'UTC',
        language: 'en',
      },
      limits: {
        maxClients: 100,
        maxMeals: 500,
        maxVideoAssignments: 1000,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  try {
    const body = await request.json().catch(() => null);
    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });

    const updatedCoach = await prisma.user.update({
      where: { id: auth.actor.id },
      data: parsed.data.profile,
      select: { id: true, name: true, email: true, role: true, updatedAt: true },
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      profile: updatedCoach,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
