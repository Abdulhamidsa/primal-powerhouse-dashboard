import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';

type AssetOwner = {
  clientId: string | null;
  coachId: string | null;
};

async function findAssetOwner(publicId: string): Promise<AssetOwner | null> {
  const client = await prisma.client.findFirst({
    where: {
      OR: [{ avatar: { contains: publicId } }, { progressPhotos: { contains: publicId } }],
    },
    select: { id: true, coachId: true },
  });

  if (client) return { clientId: client.id, coachId: client.coachId };

  const message = await prisma.message.findFirst({
    where: { attachmentsJson: { contains: publicId } },
    select: { conversation: { select: { clientId: true, coachId: true } } },
  });

  if (message?.conversation) {
    return { clientId: message.conversation.clientId, coachId: message.conversation.coachId };
  }

  const meal = await prisma.meal.findFirst({
    where: { imageUrl: { contains: publicId } },
    select: { clientId: true, coachId: true, client: { select: { coachId: true } } },
  });

  if (meal) {
    return { clientId: meal.clientId, coachId: meal.client?.coachId ?? meal.coachId };
  }

  const side = await prisma.sideItem.findFirst({
    where: { imageUrl: { contains: publicId } },
    select: { clientId: true, coachId: true, client: { select: { coachId: true } } },
  });

  if (side) {
    return { clientId: side.clientId, coachId: side.client?.coachId ?? side.coachId };
  }

  const video = await prisma.video.findFirst({
    where: { OR: [{ videoUrl: { contains: publicId } }, { thumbnailUrl: { contains: publicId } }] },
    select: { coachId: true },
  });

  if (video) return { clientId: null, coachId: video.coachId };

  const exercise = await prisma.exercise.findFirst({
    where: { OR: [{ videoUrl: { contains: publicId } }, { imageUrl: { contains: publicId } }] },
    select: { coachId: true },
  });

  if (exercise) return { clientId: null, coachId: exercise.coachId };

  return null;
}

export async function requireCloudinaryAssetAccess(request: NextRequest, publicId: string) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth;

  const owner = await findAssetOwner(publicId);
  if (!owner) {
    return {
      ok: false as const,
      res: new Response(JSON.stringify({ error: 'Media asset not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }),
    };
  }

  if (auth.user.type === 'client') {
    if (owner.clientId !== auth.user.userId) {
      return {
        ok: false as const,
        res: new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'content-type': 'application/json' },
        }),
      };
    }

    return { ok: true as const, user: auth.user, owner };
  }

  const actor = await prisma.user.findUnique({
    where: { id: auth.user.userId },
    select: { id: true, role: true },
  });

  if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'COACH')) {
    return {
      ok: false as const,
      res: new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      }),
    };
  }

  if (actor.role === 'COACH' && owner.coachId !== actor.id) {
    return {
      ok: false as const,
      res: new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      }),
    };
  }

  return { ok: true as const, user: auth.user, owner, actor };
}
