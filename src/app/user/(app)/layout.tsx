import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAME, CLIENT_AUTH_COOKIE_NAME, AuthService } from '@/lib/auth';
import UserShell from './UserShell';

export default async function UserAppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const clientToken = cookieStore.get(CLIENT_AUTH_COOKIE_NAME)?.value;
  const legacyToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const token = clientToken ?? legacyToken;
  if (!token) redirect('/user/login');

  const payload = AuthService.verifyToken(token);
  if (!payload || payload.type !== 'client') redirect('/user/login');

  return <UserShell userId={payload.userId}>{children}</UserShell>;
}
