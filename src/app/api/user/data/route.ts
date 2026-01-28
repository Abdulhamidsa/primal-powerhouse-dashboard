import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

export type DashboardUser = {
  id: string;
  name: string;
  motivationalMessage?: string | null;
  coach?: { name: string } | null;
  currentWeight?: number | null;
  goalWeight?: number | null;
};

export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth(request);

  if (error || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const clientId = user.userId;

  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        motivationalMessage: true,
        currentWeight: true,
        targetWeight: true,
        coach: { select: { name: true } },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const payload: DashboardUser = {
      id: client.id,
      name: client.name,
      motivationalMessage: client.motivationalMessage,
      coach: client.coach,
      currentWeight: client.currentWeight,
      goalWeight: client.targetWeight,
    };

    return jsonWithCache(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Database error', details: message }, { status: 500 });
  }
}
