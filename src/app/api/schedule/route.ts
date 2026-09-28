import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { requireStaffActor } from '@/lib/api-auth';
import { scheduleQuerySchema } from '@/features/schedule/schemas/schedule.schema';

export async function GET(request: NextRequest) {
  const auth = await requireStaffActor(request);
  if (!auth.ok) return auth.res;

  const parsed = scheduleQuerySchema.safeParse({
    clientId: request.nextUrl.searchParams.get('clientId') ?? undefined,
    date: request.nextUrl.searchParams.get('date') ?? undefined,
  });
  if (!parsed.success) return jsonWithCache({ error: 'Invalid schedule filters' }, { status: 400 });

  try {
    let clientFilter: { in: string[] } | { equals: string } | undefined;
    if (auth.actor.role === 'ADMIN') {
      if (parsed.data.clientId) {
        const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId }, select: { id: true } });
        if (!client) return jsonWithCache({ error: 'Client not found' }, { status: 404 });
        clientFilter = { equals: client.id };
      }
    } else if (parsed.data.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: parsed.data.clientId, coachId: auth.actor.id },
        select: { id: true },
      });
      if (!client) return jsonWithCache({ error: 'Forbidden' }, { status: 403 });
      clientFilter = { equals: client.id };
    } else {
      const clients = await prisma.client.findMany({ where: { coachId: auth.actor.id }, select: { id: true } });
      clientFilter = { in: clients.map(client => client.id) };
    }

    const [videoAssignments, mealAssignments] = await Promise.all([
      prisma.videoAssignment.findMany({
        where: {
          scheduledTime: { not: null },
          ...(clientFilter ? { clientId: clientFilter } : {}),
        },
        select: {
          id: true,
          scheduledTime: true,
          isCompleted: true,
          progress: true,
          client: { select: { id: true, name: true } },
          video: { select: { id: true, title: true, duration: true, difficulty: true } },
        },
        orderBy: { scheduledTime: 'asc' },
      }),
      prisma.mealAssignment.findMany({
        where: {
          mealPlan: clientFilter ? { clientId: clientFilter } : undefined,
        },
        select: {
          id: true,
          scheduledTime: true,
          portion: true,
          meal: { select: { id: true, name: true, type: true, calories: true } },
          mealPlan: { select: { client: { select: { id: true, name: true } } } },
        },
      }),
    ]);

    const date = parsed.data.date;
    const matchesDate = (value: string | null) => !date || (value ? value.startsWith(date) : false);
    const scheduleItems = [
      ...videoAssignments.filter(assignment => matchesDate(assignment.scheduledTime)).map(assignment => ({
        id: assignment.id,
        type: 'video' as const,
        title: assignment.video.title,
        scheduledTime: assignment.scheduledTime,
        duration: assignment.video.duration,
        client: assignment.client,
        details: {
          difficulty: assignment.video.difficulty,
          isCompleted: assignment.isCompleted,
          progress: assignment.progress,
        },
      })),
      ...mealAssignments.filter(assignment => matchesDate(assignment.scheduledTime)).map(assignment => ({
        id: assignment.id,
        type: 'meal' as const,
        title: `${assignment.meal.name} (${assignment.meal.type})`,
        scheduledTime: assignment.scheduledTime,
        duration: null,
        client: assignment.mealPlan.client,
        details: {
          mealType: assignment.meal.type,
          calories: assignment.meal.calories,
          portion: assignment.portion,
        },
      })),
    ];

    scheduleItems.sort((a, b) => String(a.scheduledTime ?? '').localeCompare(String(b.scheduledTime ?? '')));
    return jsonWithCache(scheduleItems);
  } catch {
    return jsonWithCache({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
