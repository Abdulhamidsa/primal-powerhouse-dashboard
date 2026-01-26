import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAME, AuthService } from '@/lib/auth';
import UserShell from './UserShell';

export default async function UserAppLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) redirect('/user/login');

  const payload = AuthService.verifyToken(token);
  if (!payload || payload.type !== 'client') redirect('/user/login');

  return <UserShell>{children}</UserShell>;
}
