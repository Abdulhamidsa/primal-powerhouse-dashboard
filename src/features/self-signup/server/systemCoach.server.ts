import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

const SYSTEM_COACH_EMAIL = 'system-free-program@primal.local';

export async function getOrCreateSystemCoachId(tx: typeof prisma = prisma) {
  const existing = await tx.user.findUnique({
    where: { email: SYSTEM_COACH_EMAIL },
    select: { id: true },
  });
  if (existing) return existing.id;

  const password = await AuthService.hashPassword(randomBytes(32).toString('base64url'));
  const created = await tx.user.create({
    data: {
      email: SYSTEM_COACH_EMAIL,
      name: 'Primal Free Program',
      password,
      role: 'COACH',
      isSystem: true,
    },
    select: { id: true },
  });
  return created.id;
}
