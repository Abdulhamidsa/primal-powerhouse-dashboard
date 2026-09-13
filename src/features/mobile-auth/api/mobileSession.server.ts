import { randomBytes, createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/security/jwt-secret';
import type { MobileTokenPair } from '../types/mobileAuth.types';

export const hashRefreshToken = (value: string) => createHash('sha256').update(value).digest('hex');
const sessionExpiry = () => new Date(Date.now() + 30 * 86400_000);

function accessToken(sessionId: string, user: { id: string; email: string }, authenticatedAt: Date): string {
  return jwt.sign({ userId: user.id, email: user.email, type: 'client', sid: sessionId, authenticatedAt: Math.floor(authenticatedAt.getTime() / 1000) }, getJwtSecret(), { algorithm: 'HS256', audience: 'primal-mobile', expiresIn: '15m' });
}

export async function createMobileSession(user: { id: string; email: string; name: string }): Promise<MobileTokenPair> {
  const refreshToken = randomBytes(48).toString('base64url');
  const session = await prisma.mobileSession.create({ data: { clientId: user.id, refreshHash: hashRefreshToken(refreshToken), expiresAt: sessionExpiry(), authenticatedAt: new Date() } });
  return { accessToken: accessToken(session.id, user, session.authenticatedAt), refreshToken, expiresIn: 900, user };
}

export async function rotateMobileSession(token: string): Promise<MobileTokenPair | null> {
  const refreshToken = randomBytes(48).toString('base64url');
  return prisma.$transaction(async tx => {
    const session = await tx.mobileSession.findUnique({ where: { refreshHash: hashRefreshToken(token) }, include: { client: { select: { id: true, name: true, email: true, status: true, deactivatedAt: true } } } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.client.status === 'ARCHIVED' || session.client.status === 'INACTIVE' || session.client.deactivatedAt) return null;
    const updated = await tx.mobileSession.updateMany({ where: { id: session.id, refreshHash: hashRefreshToken(token), revokedAt: null }, data: { refreshHash: hashRefreshToken(refreshToken) } });
    if (updated.count !== 1) return null;
    const { id, name, email } = session.client;
    const user = { id, name, email };
    return { accessToken: accessToken(session.id, user, session.authenticatedAt), refreshToken, expiresIn: 900, user };
  });
}
