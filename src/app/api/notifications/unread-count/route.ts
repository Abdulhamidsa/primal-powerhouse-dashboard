import { NextRequest } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const unreadCount = await prisma.notification.count({
    where: {
      clientId: auth.user.userId,
      readAt: null,
      channels: { has: 'IN_APP' },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  return jsonWithCache({ unreadCount });
}
