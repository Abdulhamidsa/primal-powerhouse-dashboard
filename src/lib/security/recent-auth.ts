import type { NextRequest } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';

const DEFAULT_MAX_TOKEN_AGE_SECONDS = Number(process.env.PRIVACY_RECENT_AUTH_MAX_AGE_SECONDS ?? 900);

type RecentAuthSuccess = {
  ok: true;
  user: {
    userId: string;
    email: string;
    type: 'client' | 'admin';
    iat?: number;
    exp?: number;
  };
};

type RecentAuthFailure = {
  ok: false;
  status: number;
  message: string;
};

export async function requireRecentClientAuth(request: NextRequest): Promise<RecentAuthSuccess | RecentAuthFailure> {
  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) {
    return { ok: false, status: 401, message: 'Unauthorized' };
  }

  const tokenIat = auth.user.authenticatedAt ?? auth.user.iat;
  if (!tokenIat) {
    return { ok: false, status: 401, message: 'Invalid token issuance time' };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const ageSeconds = nowSeconds - tokenIat;

  if (ageSeconds > DEFAULT_MAX_TOKEN_AGE_SECONDS) {
    return { ok: false, status: 401, message: 'Recent authentication required' };
  }

  return { ok: true, user: auth.user };
}
