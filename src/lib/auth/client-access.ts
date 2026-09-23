import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiAuth } from '@/lib/api-auth';

export type ClientAccessMode = 'SELF_SERVICE' | 'COACHING';

export type ClientAccessIdentity = {
  accessMode?: ClientAccessMode | string | null;
};

export function isSelfServiceClient(client: ClientAccessIdentity | null | undefined): boolean {
  return client?.accessMode === 'SELF_SERVICE';
}

export function isCoachingClient(client: ClientAccessIdentity | null | undefined): boolean {
  return !isSelfServiceClient(client);
}

export function canAccessCoachingFeatures(client: ClientAccessIdentity | null | undefined): boolean {
  return isCoachingClient(client);
}

export function coachingAccessDeniedResponse() {
  return NextResponse.json({ error: 'This feature is available for coaching clients only.' }, { status: 403 });
}

export async function requireCoachingClient(request: NextRequest) {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth;
  const client = await prisma.client.findUnique({ where: { id: auth.user.userId }, select: { accessMode: true } });
  if (!client || !canAccessCoachingFeatures(client)) return { ok: false as const, res: coachingAccessDeniedResponse() };
  return auth;
}

export async function clientHasCoachingAccess(clientId: string): Promise<boolean> {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { accessMode: true } });
  return canAccessCoachingFeatures(client);
}
