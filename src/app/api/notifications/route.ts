import { NextRequest } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

const PAGE_SIZE = 25;

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? PAGE_SIZE);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 1), PAGE_SIZE) : PAGE_SIZE;
}

function parseMetadata(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const cursor = request.nextUrl.searchParams.get('cursor');
  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));
  const now = new Date();

  const rows = await prisma.notification.findMany({
    where: {
      clientId: auth.user.userId,
      channels: { has: 'IN_APP' },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(notification => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    category: notification.category,
    actionUrl: notification.actionUrl,
    metadata: parseMetadata(notification.metadataJson),
    channels: notification.channels,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  }));

  return jsonWithCache({ items, nextCursor: hasMore ? items.at(-1)?.id ?? null : null });
}
