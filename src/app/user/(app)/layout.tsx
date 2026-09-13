import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAME, CLIENT_AUTH_COOKIE_NAME, AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requiresEmailVerification } from '@/lib/auth/client-verification';
import UserShell from './UserShell';

export default async function UserAppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const clientToken = cookieStore.get(CLIENT_AUTH_COOKIE_NAME)?.value;
  const legacyToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const token = clientToken ?? legacyToken;
  if (!token) redirect('/user/login');

  const payload = AuthService.verifyToken(token);
  if (!payload || payload.type !== 'client') redirect('/user/login');

  const client = await prisma.client.findUnique({
    where: { id: payload.userId },
    select: { signupSource: true, emailVerifiedAt: true, email: true },
  });
  if (!client) redirect('/user/login');
  if (requiresEmailVerification(client)) redirect(`/user/verify-required?email=${encodeURIComponent(client.email)}`);

  return <UserShell userId={payload.userId}>{children}</UserShell>;
}
