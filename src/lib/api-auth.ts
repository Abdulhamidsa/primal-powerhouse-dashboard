import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type Role = 'client' | 'admin';

export type ApiAuthUser = {
  userId: string;
  email: string | null;
  type: 'client' | 'admin';
  iat?: number;
  exp?: number;
};

export type StaffActor = {
  id: string;
  role: 'ADMIN' | 'COACH';
};

export type ClientResourceAccess = {
  actor: StaffActor | { id: string; role: 'CLIENT' };
  client: {
    id: string;
    coachId: string;
  };
};

export async function requireApiAuth(request: NextRequest, role?: Role) {
  const payload = await AuthService.validateRequestAuth(request, role);
  if (!payload) {
    return { ok: false as const, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (role && payload.type !== role) {
    return { ok: false as const, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true as const, user: payload };
}

export async function requireStaffActor(request: NextRequest) {
  const auth = await requireApiAuth(request, 'admin');
  if (!auth.ok) return auth;

  const actor = await prisma.user.findUnique({
    where: { id: auth.user.userId },
    select: { id: true, role: true },
  });

  if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'COACH')) {
    return {
      ok: false as const,
      res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true as const, user: auth.user, actor: actor as StaffActor };
}

export async function requireClientResourceAccess(request: NextRequest, clientId: string) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, coachId: true },
  });

  if (!client) {
    return {
      ok: false as const,
      res: NextResponse.json({ error: 'Client not found' }, { status: 404 }),
    };
  }

  if (auth.user.type === 'client') {
    if (auth.user.userId !== client.id) {
      return {
        ok: false as const,
        res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      };
    }

    return {
      ok: true as const,
      user: auth.user,
      actor: { id: auth.user.userId, role: 'CLIENT' as const },
      client,
    } satisfies { ok: true; user: ApiAuthUser; actor: { id: string; role: 'CLIENT' }; client: typeof client };
  }

  const actor = await prisma.user.findUnique({
    where: { id: auth.user.userId },
    select: { id: true, role: true },
  });

  if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'COACH')) {
    return {
      ok: false as const,
      res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  if (actor.role === 'COACH' && client.coachId !== actor.id) {
    return {
      ok: false as const,
      res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true as const, user: auth.user, actor: actor as StaffActor, client };
}

export async function requireStaffClientAccess(request: NextRequest, clientId: string) {
  const access = await requireClientResourceAccess(request, clientId);
  if (!access.ok) return access;

  if (access.actor.role === 'CLIENT') {
    return {
      ok: false as const,
      res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return access;
}
