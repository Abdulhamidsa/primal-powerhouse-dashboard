import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UserLogin from './components/UserLoginClient';
import { AUTH_COOKIE_NAME, AuthService } from '@/lib/auth';

export default async function LoginPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    const payload = AuthService.verifyToken(token);
    if (payload?.type === 'client') redirect('/user/dashboard');
  }

  return <UserLogin />;
}
