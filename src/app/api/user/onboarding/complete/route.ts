import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/security/csrf';
import { isSelfSignupSource } from '@/features/user-onboarding/lib/shouldShowWelcomeOnboarding';

export async function POST(request: NextRequest) {
  const csrf = await assertSameOrigin(request);
  if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: 403 });

  const auth = await requireApiAuth(request, 'client');
  if (!auth.ok) return auth.res;

  const client = await prisma.client.findUnique({
    where: { id: auth.user.userId },
    select: { accessMode: true, signupSource: true, onboardingCompletedAt: true },
  });

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  if (client.accessMode !== 'SELF_SERVICE' || !isSelfSignupSource(client.signupSource)) {
    return NextResponse.json({ error: 'Welcome onboarding is not available for this account.' }, { status: 403 });
  }

  const completedAt = client.onboardingCompletedAt ?? new Date();
  if (!client.onboardingCompletedAt) {
    await prisma.client.update({
      where: { id: auth.user.userId },
      data: { onboardingCompletedAt: completedAt },
    });
  }

  return NextResponse.json({ completedAt: completedAt.toISOString() });
}
