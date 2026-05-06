import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { trainingSessionService } from '@/features/training/services';

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : 10;
  const history = await trainingSessionService.getClientHistory(auth.user.userId, Number.isFinite(limit) ? limit : 10);

  return NextResponse.json(history);
}