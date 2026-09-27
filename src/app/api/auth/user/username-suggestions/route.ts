import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { suggestUsernames } from '@/features/self-signup/server/username.server';

function ip(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  if (!rateLimit(`username-suggestions:${ip(request)}`, 20, 60 * 60_000).allowed) {
    return NextResponse.json({ error: 'Please wait before requesting more suggestions.' }, { status: 429 });
  }
  return NextResponse.json({ suggestions: await suggestUsernames() });
}
