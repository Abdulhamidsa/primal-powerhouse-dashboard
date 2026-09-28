import { prisma } from '@/lib/prisma';
import type { StaffActor } from '@/lib/api-auth';

export type VideoCoachTargetResult =
  | { ok: true; coachId: string }
  | { ok: false; status: 400; error: string };

export async function resolveVideoCoachTarget(
  actor: StaffActor,
  requestedCoachId: string | undefined,
  required: boolean,
): Promise<VideoCoachTargetResult> {
  if (actor.role === 'COACH') {
    if (requestedCoachId) {
      return { ok: false, status: 400, error: 'Coaches cannot choose video ownership' };
    }

    return { ok: true, coachId: actor.id };
  }

  if (!requestedCoachId) {
    return required
      ? { ok: false, status: 400, error: 'coachId is required for admin video creation' }
      : { ok: true, coachId: '' };
  }

  const coach = await prisma.user.findUnique({
    where: { id: requestedCoachId },
    select: { id: true, role: true },
  });

  if (!coach || coach.role !== 'COACH') {
    return { ok: false, status: 400, error: 'coachId must identify a coach' };
  }

  return { ok: true, coachId: coach.id };
}
