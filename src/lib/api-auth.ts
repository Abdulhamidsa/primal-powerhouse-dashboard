import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AuthService, AUTH_COOKIE_NAME } from '@/lib/auth';

export type Role = 'client' | 'admin';

export type ApiAuthUser = {
  userId: string;
  email: string;
  type: 'client' | 'admin';
  iat?: number;
  exp?: number;
};

export function requireApiAuth(request: NextRequest, role?: Role) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
  if (!token) {
    return { ok: false as const, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const payload = AuthService.verifyToken(token) as ApiAuthUser | null;
  if (!payload) {
    return { ok: false as const, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (role && payload.type !== role) {
    return { ok: false as const, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true as const, user: payload };
}
